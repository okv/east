'use strict';

var BaseCommand = require('./action').Command,
	inherits = require('util').inherits;

function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._getDefaultMigrationNames = function(params, callback) {
	var status = params.command.status || 'new';
	this.migrator.getMigrationNames(status, callback);
};

Command.prototype._getTargetMigrationNames = function(separated) {
	return separated.newNames;
};

Command.prototype._processSeparated = function(separated) {
	var self = this;
	separated.executedNames.forEach(function(name) {
		self.logger.log('skip `' + name + '` because it`s already executed');
	});
};

Command.prototype._executeMigration = function(migration, callback) {
	var self = this;
	self.logger.log('migrate `' + migration.name + '`');
	this.migrator.migrate(migration, function(err) {
		if (err) return callback(err);
		self.logger.log('migration done');
		callback();
	});
};
