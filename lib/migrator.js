'use strict';

var path = require('path'),
	fs = require('fs'),
	DefaultAdapter = require('./adapter');

/**
 * Main class
 */
function Migrator(program) {
	var cwd = process.cwd();
	this.configPath = program.config || path.join(cwd, '.eastrc'),
	this.migrationsDir = program.dir || path.join(cwd, 'migrations'),
	this.adapter = program.adapter || new DefaultAdapter({
		migrationsDir: this.migrationsDir
	});
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

module.exports = Migrator;
