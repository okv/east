'use strict';

var pathUtils = require('path'),
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
	self.params = self._loadConfig(params.config);
	var defaults = {
		// migrations dir
		dir: pathUtils.resolve('migrations'),
		// execution timeout (one week by default - unreal)
		timeout: 7 * 24 * 60 * 60 * 1000,
		// adapter path to require
		adapter: './adapter',
		// db url
		url: null,
		trace: false
	};
	utils.keys(defaults).forEach(function(key) {
		if (key in params) self.params[key] = params[key];
		if (key in self.params === false) self.params[key] = defaults[key];
	});
	// create adapter
	self.adapter = self._createAdapter(self.params.adapter, self.params);
	// get default path to migration template from adapter
	if (!self.params.template) {
		self.params.template = this.adapter.getTemplatePath();
	}
}

Migrator.prototype._loadConfig = function(configPath) {
	if (configPath) {
		configPath = pathUtils.resolve(configPath);
	} else {
		var defaultConfigPath = pathUtils.resolve('.eastrc');
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
	var paths = [adapterPath, pathUtils.join(process.cwd(), adapterPath)],
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

Migrator.prototype.isDirExists = function(callback) {
	var migrationsDir = this.params.dir;

	Steppy(
		function() {
			utils.fsExists(migrationsDir, this.slot());
		},
		callback
	);
};

Migrator.prototype.init = function(callback) {
	var self = this;

	Steppy(
		function() {
			self.isDirExists(this.slot());
		},
		function(err, dirExists) {
			var migrationsDir = self.params.dir;

			if (dirExists) {
				throw new Error(
					'Migration directory `' + migrationsDir + '` already exists'
				);
			}

			fs.mkdir(migrationsDir, this.slot());
		},
		callback
	);
};

Migrator.prototype.create = function(baseName, callback) {
	var self = this,
		name;

	Steppy(
		function() {
			self._getNextNumber(this.slot());
		},
		function(err, num) {
			name = num + '_' + baseName;

			fs.readFile(self.params.template, this.slot());
		},
		function(err, templateText) {
			var path = self.getMigrationPathByName(name);

			fs.writeFile(path, templateText, this.slot());
		},
		function(err) {
			this.pass(name);
		},
		callback
	);
};

Migrator.prototype.remove = function(name, callback) {
	var self = this;

	Steppy(
		function() {
			var path = self.getMigrationPathByName(name);

			fs.unlink(path, this.slot());
		},
		callback
	);
};

Migrator.prototype.getAllMigrationNames = function(callback) {
	var self = this;

	Steppy(
		function() {
			fs.readdir(self.params.dir, this.slot());
		},
		function(err, paths) {
			var names = paths
				.filter(function(fileName) {
					return self._fileNameRegExp.test(fileName);
				})
				.sort(function(fileNameOne, fileNameTwo) {
					return (
						self._getNumber(fileNameOne) - self._getNumber(fileNameTwo)
					);
				})
				.map(self.getMigrationNameByPath);

			this.pass(names);
		},
		callback
	);
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
	return pathUtils.resolve(
		pathUtils.join(this.params.dir, name + '.js')
	);
};

Migrator.prototype.getMigrationNameByPath = function(path) {
	return pathUtils.basename(path, '.js');
};

Migrator.prototype.getMigrationNames = function(status, callback) {
	var self = this;

	Steppy(
		function() {
			if (status === 'all') {
				self.getAllMigrationNames(this.slot());
			} else if (status === 'executed') {
				self.adapter.getExecutedMigrationNames(this.slot());
			} else if (status === 'new') {
				self.getNewMigrationNames(this.slot());
			} else {
				throw new Error('Unrecognized status `' + status + '`');
			}
		},
		callback
	);
};

Migrator.prototype.isMigrationExists = function(name, callback) {
	var self = this;

	Steppy(
		function() {
			var path = self.getMigrationPathByName(name);

			utils.fsExists(path, this.slot());
		},
		callback
	);
};

// check that all migrations exists
Migrator.prototype.checkMigrationsExists = function(names, callback) {
	var self = this;

	Steppy(
		function() {
			var existGroup = this.makeGroup();

			names.forEach(function(name) {
				self.isMigrationExists(name, existGroup.slot());
			});
		},
		function(err, existGroupResults) {
			existGroupResults.forEach(function(migrationExists, index) {
				if (!migrationExists) {
					var name = names[index];

					throw new Error('Migration `' + name + '` doesn`t exist');
				}
			});

			this.pass(null);
		},
		callback
	);
};

Migrator.prototype.validateMigration = function(migration, callback) {
	Steppy(
		function() {
			if (!utils.isObject(migration)) {
				throw new Error('migration is not an object');
			}

			if (!migration.migrate) {
				throw new Error('`migrate` function is not set');
			}

			if (!utils.isFunction(migration.migrate)) {
				throw new Error('`migrate` is not a function');
			}

			if (migration.rollback && !utils.isFunction(migration.rollback)) {
				throw new Error('`rollback` set but it`s not a function');
			}

			if (migration.tags && !utils.isArray(migration.tags)) {
				throw new Error('`tags` set but it`s not an array');
			}

			this.pass(null);
		},
		callback
	);
};

Migrator.prototype.loadMigration = function(name, callback) {
	var self = this;

	Steppy(
		function() {
			var migration = require(self.getMigrationPathByName(name));

			this.pass(migration);

			self.validateMigration(migration, this.slot());
		},
		function(err, migration) {
			if (err) {
				err.message = (
					'Error during load of migration "' + name +
					'": ' + err.message
				);
			} else {
				migration.name = name;
			}

			callback(err, migration);
		}
	);
};

Migrator.prototype.connect = function(callback) {
	var self = this;

	Steppy(
		function() {
			self.adapter.connect(this.slot());
		},
		function(err, params) {
			self._migrationParams = params || {};

			// add helpers
			self._migrationParams.createBar = function(total) {
				var bar = new ProgressBar(
					'[:bar] :current / :total',
					{total: total, width: 30, incomplete: ' '}
				);
				return bar;
			};

			this.pass(null);
		},
		callback
	);
};

Migrator.prototype.disconnect = function(callback) {
	this.adapter.disconnect(callback || utils.noop);
};

Migrator.prototype.isAsyncAction = function(action, callback) {
	return action.length > 1;
};

Migrator.prototype._executeAsyncAction = function(action, callback) {
	var self = this,
		callbackExecuted = false,
		timeout = this.params.timeout;

	Steppy(
		function() {
			// timer which controls max callback execution duration
			var timeoutId = setTimeout(function() {
				if (!callbackExecuted) {
					callback(
						new Error(
							'callback execution timeout exceeded (' +
							timeout + ' ms)'
						)
					);
				}
			}, timeout);

			this.pass(timeoutId);

			action(self._migrationParams, this.slot());
		},
		function(err, timeoutId) {
			if (!err && callbackExecuted) {
				err = new Error('Callback called more than once');
			}

			if (err) {
				return callback(err);
			}

			callbackExecuted = true;

			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			callback(err);
		}
	);
};

// execute action function
Migrator.prototype._executeAction = function(action, callback) {
	var self = this;

	Steppy(
		function() {
			if (self.isAsyncAction(action)) {
				self._executeAsyncAction(action, this.slot());
			} else {
				action(self._migrationParams);

				this.pass(null);
			}

		},
		callback
	);
};

// execute some migration action (migrate or rollback)
Migrator.prototype._executeMigration = function(migration, action, callback) {
	var self = this;

	Steppy(
		function() {
			self._executeAction(migration[action], this.slot());
		},
		function(err) {
			if (migration.force) {
				self.adapter.getExecutedMigrationNames(this.slot());
			} else {
				this.pass(null);

				if (action === 'migrate') {
					self.adapter.markExecuted(migration.name, this.slot());
				} else {
					self.adapter.unmarkExecuted(migration.name, this.slot());
				}
			}
		},
		function(err, executedNames) {
			if (executedNames) {
				var isExecuted = executedNames.indexOf(migration.name) !== -1;

				if (action === 'migrate' && !isExecuted) {
					self.adapter.markExecuted(migration.name, this.slot());
				} else if (action === 'rollback' && isExecuted) {
					self.adapter.unmarkExecuted(migration.name, this.slot());
				} else {
					this.pass(null);
				}
			} else {
				this.pass(null);
			}
		},
		function(err) {
			if (err) {
				err.message = (
					'Error during ' + action + ' "' + migration.name + '": ' +
					err.message
				);
			}

			callback(err);
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
				name = pathUtils.basename(name, '.js');
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
