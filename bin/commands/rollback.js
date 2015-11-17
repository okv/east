'use strict';

var BaseCommand = require('./action').Command,
	inherits = require('util').inherits;

function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._getDefaultMigrationNames = function(callback) {
	this.migrator.adapter.getExecutedMigrationNames(function(err, names) {
		callback(err, names && names.reverse());
	});
};

Command.prototype._getTargetMigrationNames = function(separated) {
	return separated.executedNames;
};

Command.prototype._processSeparated = function(separated) {
	var self = this;
	separated.newNames.forEach(function(name) {
		self.logger.log('skip `' + name + '` because it`s not executed yet');
	});
};

Command.prototype._executeMigration = function(migration, callback) {
	var self = this;
	if (migration.rollback) {
		self.logger.log('rollback `' + migration.name + '`');
		this.migrator.rollback(migration, function(err) {
			if (err) return callback(err);
			self.logger.log('migration successfully rolled back');
			callback();
		});
	} else {
		self.logger.log(
			'skip `' + migration.name + '` because rollback function is not set'
		);
		callback();
	}
};
