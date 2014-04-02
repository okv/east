'use strict';

var path = require('path'),
	fs = require('fs'),
	ProgressBar = require('progress');

/**
 * Main class
 */
function Migrator(params) {
	params = params || {};
	var self = this,
		cwd = process.cwd();
	// merge parameters
	self.params = self._loadConfig(
		params.config || path.join(cwd, '.eastrc')
	);
	var defaults = {
		// migrations dir
		dir: path.join(cwd, 'migrations'),
		// execution timeout
		timeout: 4000,
		// adapter path to require
		adapter: './adapter',
		// db url
		url: null,
		trace: false
	};
	Object.keys(defaults).forEach(function(key) {
		if (key in params) self.params[key] = params[key];
		if (key in self.params === false) self.params[key] = defaults[key];
	});
	// create adapter
	self.adapter = self._createAdapter(self.params.adapter, self.params);
	// get default path to migration template from adapter
	if (!self.params.template) self.params.template = this.adapter.getTemplatePath();
}

Migrator.prototype._loadConfig = function(configPath) {
	if (!fs.existsSync(configPath)) return {};
	try {
		return JSON.parse(fs.readFileSync(configPath));
	} catch (err) {
		err.message =
			'Error while loading config `' + configPath + '`:\n' + err.message;
		throw err;
	}
};

Migrator.prototype._createAdapter = function(adapter, params) {
	try {
		return new (require(adapter))(params);
	} catch (err) {
		err.message =
			'Error while loading adapter `' + adapter + '`:\n' + err.message;
		throw err;
	}
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
Migrator.prototype._fileNameRegExp = new RegExp(nameRegExpStr + '\.js$');

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
	})
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
		callback(new Error('Unrecognized status `' + status + '`'))
	}
}

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
				callback(new Error('Migration `' + name + '` doesn`t exists'));
			}
			if (existsCount == names.length) callback();
		});
	});
};

Migrator.prototype.validateMigration = function(migration, callback) {
	var msg = null;
	if (!isObject(migration)) msg = 'migration is not an object';
	if (!migration.migrate) msg = '`migrate` function is not set';
	if (!isFunction(migration.migrate)) msg = '`migrate` is not a function';
	if (migration.rollback && !isFunction(migration.rollback))
			msg = '`rollback` set but it`s not a function';
	callback(msg ? new Error(msg) : null);
};

Migrator.prototype.loadMigration = function(name, callback) {
	var migration = require(this.getMigrationPathByName(name));
	this.validateMigration(migration, function(err) {
		if (err) {callback(err); return;}
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
	this.adapter.disconnect(callback || noop);
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
			if (err) {callback(err); return; }
			self.adapter[action == 'migrate' ? 'markExecuted' : 'unmarkExecuted'](
				migration.name, callback
			);
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
	this.adapter.getExecutedMigrationNames(function(err, executedNames) {
		var executedNamesHash = {};
		executedNames.forEach(function(name) { executedNamesHash[name] = 1; });
		var	executedNames = [],
			newNames = [];
		names.forEach(function(name) {
			if (name in executedNamesHash) {
				executedNames.push(name);
			} else {
				newNames.push(name);
			}
		});
		callback(null, newNames, executedNames);
	});
};

// convert full names, basenames or numbers to full names
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
		try {
			var normalizedNames = names.map(function(name) {
				name = path.basename(name, '.js');
				// check by full name
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

function isFunction(value) {
	return Object.prototype.toString.call(value) == '[object Function]';
}

function isObject(value) {
	return Object.prototype.toString.call(value) == '[object Object]';
}

function noop() {}

module.exports = Migrator;
