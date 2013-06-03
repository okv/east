'use strict';

var path = require('path'),
	fs = require('fs');

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
	fs.mkdirSync(this.params.dir);	
	callback();
};

Migrator.prototype.isDirExists = function() {
	return fs.existsSync(this.params.dir);
};

Migrator.prototype.create = function(basename, callback) {
	var self = this;
	self._nextNum(function(err, num) {
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
			.sort(function(a, b) {
				return self._numfn(a) - self._numfn(b);
			})
			.map(self.getMigrationNameByPath)
			//skip hidden files
			.filter(function(name) {
				return /^\./.test(name) === false;
			});
		callback(null, names);
	});
};

// gets number from name
Migrator.prototype._numfn = function(name) {
	var numParts = /^([0-9]+)_/.exec(name);
	return numParts ? Number(numParts[1]) : 0;
};

Migrator.prototype._nextNum = function(callback) {
	var self = this;
	self.getAllMigrationNames(function(err, allNames) {
		if (err) {callback(err); return;}
		var last = allNames[allNames.length - 1],
			num = self._numfn(last);
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
	return path.join(this.params.dir, name + '.js');
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
		self._migrationParams = params;
		callback(err);
	});
};

Migrator.prototype.disconnect = function(callback) {
	this.adapter.disconnect(callback);
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
		callback = function() {
			callbackRunned = true;
			if (timeoutId) clearTimeout(timeoutId);
			oldCallback();
		};
		// run action with wrapped callback
		action(this._migrationParams, callback);
	} else {
		callback(null, action(this._migrationParams));
	}
};

// execute some migration action (migrate or rollback)
Migrator.prototype._executeMigration = function(migration, isMigrate, callback) {
	var self = this;
	self._executeAction(
		migration[isMigrate ? 'migrate' : 'rollback'], function(err) {
			if (err) {callback(err); return; }
			self.adapter[isMigrate ? 'markExecuted' : 'unmarkExecuted'](
				migration.name, callback
			);
		}
	);
};

Migrator.prototype.execute = function(migration, callback) {
	this._executeMigration(migration, true, callback);
};

Migrator.prototype.rollback = function(migration, callback) {
	this._executeMigration(migration, false, callback);
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

function isFunction(value) {
	return Object.prototype.toString.call(value) == '[object Function]';
}

function isObject(value) {
	return Object.prototype.toString.call(value) == '[object Object]';
}

module.exports = Migrator;
