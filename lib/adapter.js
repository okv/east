'use strict';

var path = require('path'),
	fs = require('fs');

function Adapter(params) {
	this.params = params || {};
	if (!this.params.migrationsDir) throw new Error(
		'`migrationsDir` parameter required'
	);
	this.migrationsFilePath = path.join(this.params.migrationsDir, '.migrations');
	this.dir = __dirname;
}

Adapter.prototype.getTemplatePath = function() {
	return path.join(this.dir, 'migrationTemplate.js');
};

Adapter.prototype.getExecutedMigrationNames = function(callback) {
	var self = this;
	fs.exists(self.migrationsFilePath, function(exists) {
		if (!exists) {
			self._writeMigrationNames([], function() {
				self._readMigrationNames(callback);
			});
		} else {
			self._readMigrationNames(callback);
		}
	});
};

Adapter.prototype.markExecuted = function(name, callback) {
	var self = this;
	self.getExecutedMigrationNames(function(err, names) {
		if (~names.indexOf(name)) {
			callback(null);
		} else {
			names.push(name);
			self._writeMigrationNames(names, callback);
		}
	});
};

Adapter.prototype.unmarkExecuted = function(name, callback) {
	var self = this;
	self.getExecutedMigrationNames(function(err, names) {
		if (~names.indexOf(name)) {
			names.splice(names.indexOf(name), 1);
			self._writeMigrationNames(names, callback);
		} else {
			callback(null);
		}
	});
};

Adapter.prototype._readMigrationNames = function(callback) {
	fs.readFile(this.migrationsFilePath, function(err, content) {
		if (err) { callback(err); return; }
		callback(null, JSON.parse(content));
	});
};

Adapter.prototype._writeMigrationNames = function(names, callback) {
	fs.writeFile(
		this.migrationsFilePath, JSON.stringify(names, null, 4), callback
	);
};

module.exports = Adapter;
