'use strict';

var path = require('path'),
	fs = require('fs'),
	DefaultAdapter = require('./adapter');

/**
 * Main class
 */
function Migrator(params) {
	var cwd = process.cwd();
	this.configPath = params.config || path.join(cwd, '.eastrc'),
	this.migrationsDir = params.dir || path.join(cwd, 'migrations'),
	this.adapter = params.adapter || new DefaultAdapter({
		migrationsDir: this.migrationsDir
	});
	this.execTimeout = 2000;
}

Migrator.prototype.getAllMigrationNames = function(callback) {
	var self = this;
	fs.readdir(this.migrationsDir, function(err, paths) {
		if (err) { callback(err); return; }
		var names = paths
			.sort()
			.map(self.getMigrationNameByPath)
			//skip hidden files
			.filter(function(name) {
				return /^\./.test(name) === false;
			});
		callback(null, names);
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
	return path.join(this.migrationsDir, name + '.js');
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

Migrator.prototype.isAsyncAction = function(action, callback) {
	return action.length > 0;
};

// execute action function
Migrator.prototype._executeAction = function(action, callback) {
	if (this.isAsyncAction(action)) {
		var oldCallback = callback,
			callbackRunned = false,
			timeout = this.execTimeout;
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
		action(callback);
	} else {
		callback(null, action());
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

function isFunction(value) {
	return Object.prototype.toString.call(value) == '[object Function]';
}

function isObject(value) {
	return Object.prototype.toString.call(value) == '[object Object]';
}

module.exports = Migrator;
