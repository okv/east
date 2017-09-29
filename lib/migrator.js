'use strict';

var path = require('path'),
	fs = require('fs'),
	ProgressBar = require('progress'),
	utils = require('./utils'),
	Steppy = require('twostep').Steppy,
	expressionify = require('expressionify');

/**
 * Main class
 */
function Migrator(params) {
	params = params || {};
	var self = this;
	// merge parameters
	var defaults = {
		// migrations dir
		dir: path.resolve('migrations'),
		// execution timeout (one week by default - unreal)
		timeout: 7 * 24 * 60 * 60 * 1000,
		// adapter path to require
		adapter: './adapter',
		// db url
		url: null,
		trace: false
	};

	// param precedence:
	// params config overrides resource config overrides default config
	self.params = Object.assign(defaults, self._loadConfig(params.config), params);

	// create adapter
	self.adapter = self._createAdapter(self.params.adapter, self.params);
	// get default path to migration template from adapter
	if (!self.params.template) {
		self.params.template = this.adapter.getTemplatePath();
	}
}

Migrator.prototype._loadConfig = function(configPath) {
	if (configPath) {
		configPath = path.resolve(configPath);
	} else {
		var defaultConfigPath = path.resolve('.eastrc');
		configPath = fs.existsSync(defaultConfigPath) ? defaultConfigPath : '';
	}
	if (!configPath) return {};
	try {
		return JSON.parse(fs.readFileSync(configPath));
	} catch (readErr) {
		try {
			return require(configPath);
		} catch(requireErr) {
			throw new Error(
				'Error while loading config `' + configPath + '` as json:\n' +
				(readErr.stack || readErr.message) + '\n\n and as script:\n' +
				(requireErr.stack || requireErr.message) + '\n'
			);
		}
	}
};

Migrator.prototype._tryLoadAdapter = function(path) {
	try {
		return require(path);
	} catch (err) {
		return err;
	}
};

Migrator.prototype._createAdapter = function(adapterPath, params) {
	// try load adapter from migrator-related path first then from cwd-related
	var paths = [adapterPath, path.join(process.cwd(), adapterPath)],
		Adapter,
		errors = [];
	for (var i = 0; i < paths.length; i++) {
		Adapter = this._tryLoadAdapter(paths[i]);
		if (Adapter instanceof Error) {
			errors.push(Adapter);
		} else {
			break;
		}
	}
	// if adapter is not loaded put all error messages into throwing error
	if (Adapter instanceof Error) {
		var error = new Error('Error loading adapter from all paths:\n');
		errors.forEach(function(err) {
			error.message += '\n' + (err.stack || err.message) + '\n';
		});
		throw error;
	}
	return new Adapter(params);
};

Migrator.prototype.init = function(callback) {
	if (this.isDirExists()) throw Error(
		'Migration directory `' + this.params.dir + '` already exists'
	);
	function mkdirpSync(dir) {
		try {
			fs.mkdirSync(dir);
		} catch(err) {
			if (err.code == 'ENOENT') {
				mkdirpSync(path.dirname(dir));
				mkdirpSync(dir);
			} else {
				throw err;
			}
		}
	}
	mkdirpSync(this.params.dir);
	callback();
};

Migrator.prototype.isDirExists = function() {
	return fs.existsSync(this.params.dir);
};

Migrator.prototype.create = function(basename, callback) {
	var self = this;
	self._getNextNumber(function(err, num) {
		if (err) {callback(err); return;}
		var name = num + '_' + basename;
		fs.readFile(self.params.template, function(err, content) {
			if (err) {callback(err); return;}
			fs.writeFile(self.getMigrationPathByName(name), content, function(err) {
				callback(err, name);
			});
		});
	});
};

Migrator.prototype.remove = function(name) {
	fs.unlinkSync(this.getMigrationPathByName(name));
};

Migrator.prototype.getAllMigrationNames = function(callback) {
	var self = this;
	fs.readdir(this.params.dir, function(err, paths) {
		if (err) { callback(err); return; }
		var names = paths
			.filter(function(fileName) {
				return self._fileNameRegExp.test(fileName);
			})
			.sort(function(a, b) {
				return self._getNumber(a) - self._getNumber(b);
			})
			.map(self.getMigrationNameByPath);
		callback(null, names);
	});
};

var nameRegExpStr = '^([0-9]+)_(.*)';
Migrator.prototype._nameRegExp = new RegExp(nameRegExpStr);
Migrator.prototype._fileNameRegExp = new RegExp(nameRegExpStr + '\\.js$');

// get number from name
Migrator.prototype._getNumber = function(name) {
	var numParts = this._nameRegExp.exec(name);
	return numParts ? Number(numParts[1]) : 0;
};

// get basename from name
Migrator.prototype._getBaseName = function(name) {
	return this._nameRegExp.exec(name)[2];
};

Migrator.prototype._getNextNumber = function(callback) {
	var self = this;
	self.getAllMigrationNames(function(err, allNames) {
		if (err) {callback(err); return;}
		var last = allNames[allNames.length - 1],
			num = self._getNumber(last);
		callback(null, ++num);
	});
};

Migrator.prototype.getNewMigrationNames = function(callback) {
	function findNewNames(allNames, executedNames) {
		var executedNamesHash = {};
		executedNames.forEach(function(name) { executedNamesHash[name] = 1; });
		var newNames = allNames.filter(function(name) {
			return (name in executedNamesHash === false);
		});
		callback(null, newNames);
	}
	var self = this;
	self.getAllMigrationNames(function(err, allNames) {
		if (err) { callback(err); return; }
		self.adapter.getExecutedMigrationNames(function(err, executedNames) {
			if (err) { callback(err); return; }
			findNewNames(allNames, executedNames);
		});
	});
};

Migrator.prototype._filterMigrationNamesByTag = function(params, callback) {
	var self = this,
		migrations = [];
	Steppy(
		function() {
			var funcs = params.names.map(function(name) {
				return function() {
					var stepCallback = this.slot();
					self.loadMigration(name, function(err, migration) {
						migrations.push(migration);
						stepCallback(err);
					});
				};
			});
			funcs.push(this.slot());
			Steppy.apply(null, funcs);
		},
		function(err) {
			var names = [];
			var evalTagExpression = expressionify(params.tag, {
				operators: utils.booleanOperators
			});
			migrations.forEach(function(migration) {
				var expressionResult = evalTagExpression({
					parseOperand: function(operand) {
						return migration.tags && migration.tags.indexOf(operand) !== -1;
					}
				});

				if (expressionResult) {
					names.push(migration.name);
				}
			});
			this.pass({names: names});
		},
		callback
	);
};

Migrator.prototype.filterMigrationNames = function(params, callback) {
	var self = this;
	Steppy(
		function() {
			if (params.by === 'tag') {
				self._filterMigrationNamesByTag(params, this.slot());
			} else {
				throw new Error('Don`t know how to filter by ' + params.by);
			}
		},
		callback
	);
};

Migrator.prototype.getMigrationPathByName = function(name) {
	return path.resolve(path.join(this.params.dir, name + '.js'));
};

Migrator.prototype.getMigrationNameByPath = function(mpath) {
	return path.basename(mpath, '.js');
};

Migrator.prototype.getMigrationNames = function(status, callback) {
	if (status == 'all') {
		this.getAllMigrationNames(callback);
	} else if (status == 'executed') {
		this.adapter.getExecutedMigrationNames(callback);
	} else if (status == 'new') {
		this.getNewMigrationNames(callback);
	} else {
		callback(new Error('Unrecognized status `' + status + '`'));
	}
};

Migrator.prototype.isMigrationExists = function(name, callback) {
	fs.exists(this.getMigrationPathByName(name), function(exists) {
		callback(null, exists);
	});
};

// check that all migrations exists
Migrator.prototype.checkMigrationsExists = function(names, callback) {
	var self = this,
		existsCount = 0;
	names.forEach(function(name) {
		self.isMigrationExists(name, function(err, exists) {
			if (exists) {
				existsCount++;
			} else {
				callback(new Error('Migration `' + name + '` doesn`t exist'));
			}
			if (existsCount == names.length) callback();
		});
	});
};

Migrator.prototype.validateMigration = function(migration, callback) {
	var msg = null;
	if (!utils.isObject(migration)) {
		msg = 'migration is not an object';
	} else if (!migration.migrate) {
		msg = '`migrate` function is not set';
	} else if (
		!utils.isFunction(migration.migrate) &&
		!utils.isAsyncFunction(migration.migrate)
	) {
		msg = '`migrate` is not a function';
	} else if (
		migration.rollback &&
		!utils.isFunction(migration.rollback) &&
		!utils.isAsyncFunction(migration.rollback)
	) {
		msg = '`rollback` set but it`s not a function';
	} else if (migration.tags && !utils.isArray(migration.tags)) {
		msg = '`tags` set but it`s not an array';
	}
	callback(msg ? new Error(msg) : null);
};

Migrator.prototype.loadMigration = function(name, callback) {
	var migration = require(this.getMigrationPathByName(name));
	this.validateMigration(migration, function(err) {
		if (err) {
			err.message = (
				'Error during load of migration "' + name +
				'": ' + err.message
			);
			return callback(err);
		}
		migration.name = name;
		callback(null, migration);
	});
};

Migrator.prototype.connect = function(callback) {
	var self = this;
	self.adapter.connect(function(err, params) {
		self._migrationParams = params || {};
		// add helpers
		self._migrationParams.createBar = function(total) {
			var bar = new ProgressBar(
				'[:bar] :current / :total',
				{total: total, width: 30, incomplete: ' '}
			);
			return bar;
		};
		callback(err);
	});
};

Migrator.prototype.disconnect = function(callback) {
	this.adapter.disconnect(callback || utils.noop);
};

Migrator.prototype.isAsyncAction = function(action, callback) {
	return action.length > 1;
};

// execute action function
Migrator.prototype._executeAction = function(action, callback) {
	if (this.isAsyncAction(action)) {
		var oldCallback = callback,
			callbackRunned = false,
			timeout = this.params.timeout;
		// timer which controls max callback execution duration
		var timeoutId = setTimeout(function() {
			if (!callbackRunned) oldCallback(new Error(
				'callback execution timeout exceeded (' + timeout + ' ms)'
			));
		}, timeout);
		// wrap original callback
		callback = function(err) {
			err = err || callbackRunned && new Error(
				'Callback called more than once'
			);
			if (err) {oldCallback(err); return;}
			callbackRunned = true;
			if (timeoutId) clearTimeout(timeoutId);
			oldCallback(err);
		};
		// run action with wrapped callback
		action(this._migrationParams, callback);
	} else {
		callback(null, action(this._migrationParams));
	}
};

// execute some migration action (migrate or rollback)
Migrator.prototype._executeMigration = function(migration, action, callback) {
	var self = this;
	self._executeAction(
		migration[action], function(err) {
			if (err) {
				err.message = (
					'Error during ' + action + ' "' + migration.name + '": ' +
					err.message
				);
				return callback(err);
			}
			if (migration.force) {
				self.adapter.getExecutedMigrationNames(function(err, executedNames) {
					if (err) { callback(err); return; }

					var isExecuted = executedNames.indexOf(migration.name) != -1;

					if (action == 'migrate' && !isExecuted) {
						self.adapter.markExecuted(migration.name, callback);
					} else if (action == 'rollback' && isExecuted) {
						self.adapter.unmarkExecuted(migration.name, callback);
					} else {
						callback();
					}
				});
			} else {
				self.adapter[action == 'migrate' ? 'markExecuted' : 'unmarkExecuted'](
					migration.name, callback
				);
			}
		}
	);
};

Migrator.prototype.migrate = function(migration, callback) {
	this._executeMigration(migration, 'migrate', callback);
};

Migrator.prototype.rollback = function(migration, callback) {
	this._executeMigration(migration, 'rollback', callback);
};

// separate passed migrations on new and executed
Migrator.prototype.separateNames = function(names, callback) {
	this.adapter.getExecutedMigrationNames(function(err, allExecutedNames) {
		var allExecutedNamesHash = {};
		allExecutedNames.forEach(function(name) {
			allExecutedNamesHash[name] = 1;
		});

		var	executedNames = [],
			newNames = [];

		names.forEach(function(name) {
			if (name in allExecutedNamesHash) {
				executedNames.push(name);
			} else {
				newNames.push(name);
			}
		});

		callback(null, newNames, executedNames);
	});
};

// convert paths, full names, basenames or numbers to full names
Migrator.prototype.normalizeNames = function(names, callback) {
	var self = this;
	this.getAllMigrationNames(function(err, allNames) {
		if (err) {callback(err); return;}
		var numbersHash = {},
			baseNamesHash = {},
			namesHash = {};
		// build hashes
		allNames.forEach(function(name) {
			namesHash[name] = name;
			var number = self._getNumber(name);
			if (!numbersHash[number]) numbersHash[number] = [];
			numbersHash[number].push(name);
			var baseName = self._getBaseName(name);
			if (!baseNamesHash[baseName]) baseNamesHash[baseName] = [];
			baseNamesHash[baseName].push(name);
		});

		var normalizedNames;

		try {
			normalizedNames = names.map(function(name) {
				name = path.basename(name, '.js');
				// check by full name (or path, coz `basename` removes dir)
				if (name in namesHash) return name;
				// check by number
				var numberParts = /^[0-9]+$/.exec(name),
					number = numberParts ? numberParts[0] : null;
				if (number) {
					if (number in numbersHash) {
						if (numbersHash[name].length == 1) {
							return numbersHash[number][0];
						} else {
							throw new Error(
								'Specified migration name `' + name + '` is ambiguous: ' +
								numbersHash[number].join(', ') + ' please choose one'
							);
						}
					}
				} else {
				// check by base name
					var baseName = name;
					if (baseName in baseNamesHash) {
						if (baseNamesHash[name].length == 1) {
							return baseNamesHash[baseName][0];
						} else {
							throw new Error(
								'Specified migration name `' + name + '` is ambiguous: ' +
								baseNamesHash[baseName].join(', ') + ' please choose one'
							);
						}
					}

				}
				return name;
			});
		} catch(error) {
			err = error;
		}

		callback(err, normalizedNames);
	});
};


module.exports = Migrator;
