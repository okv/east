'use strict';

var BaseCommand = require('./action').Command,
	inherits = require('util').inherits;

function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._getDefaultMigrationNames = function(params) {
	const status = params.command.status || 'executed';

	return Promise.resolve()
		.then(() => {
			return this.migrator.getMigrationNames(status);
		})
		.then((names) => {
			return names && names.reverse();
		});
};

Command.prototype._getTargetMigrationNames = function(separated) {
	return separated.executedNames;
};

Command.prototype._processSeparated = function(separated) {
	separated.newNames.forEach((name) => {
		this.logger.log('skip `' + name + '` because it`s not executed yet');
	});
};

Command.prototype._executeMigration = function(migration) {
	return Promise.resolve()
		.then(() => {
			if (migration.rollback) {
				this.logger.log('rollback `' + migration.name + '`');

				return this.migrator.rollback(migration);
			} else {
				this.logger.log(
					'skip `' + migration.name + '` because rollback function is not set'
				);
			}
		})
		.then(() => {
			if (migration.rollback) {
				this.logger.log('migration successfully rolled back');
			}
		});
};
