'use strict';

var path = require('path'),
	fs = require('fs');

/**
 * Fs adapter stores executed migration in file system.
 * NOTICE: because of entry file is read and write and it's async operations
 * parallel execution of write operations (`markExecuted` or `unmarkExecuted`)
 * could break executed migrations list.
 */
function Adapter(params) {
	this.params = params || {};
	if (!this.params.dir) throw new Error(
		'`dir` parameter required'
	);
	this.migrationsFilePath =
		this.params.migrationsFile || path.join(this.params.dir, '.migrations');
	this.dir = __dirname;
}

Adapter.prototype.getTemplatePath = function() {
	return path.join(this.dir, 'migrationTemplate.js');
};

/**
 * Method connects to databse and returns single object which will be passed to
 * migrate rollback functions
 */
Adapter.prototype.connect = function(callback) {
	callback();
};

Adapter.prototype.disconnect = function(callback) {
	callback();
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
