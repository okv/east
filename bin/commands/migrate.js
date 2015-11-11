'use strict';

var BaseCommand = require('./action').Command,
	inherits = require('util').inherits,
	Steppy = require('twostep').Steppy;

function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._getDefaultMigrationNames = function(callback) {
	this.migrator.getNewMigrationNames(callback);
};

Command.prototype._getTargetMigrationNames = function(separated) {
	return separated.newNames;
};

Command.prototype._processSeparated = function(separated) {
	separated.executedNames.forEach(function(name) {
		console.log('skip `' + name + '` because it`s already executed');
	});
};

Command.prototype._executeMigration = function(migration, callback) {
	console.log('migrate `' + migration.name + '`');
	this.migrator.migrate(migration, function(err) {
		if (err) return callback(err);
		console.log('migration done');
		callback();
	});
};
