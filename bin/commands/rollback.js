'use strict';

const BaseCommand = require('./action').Command;
const inherits = require('util').inherits;

function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._getDefaultMigrationNames =
	function _getDefaultMigrationNames(params) {
		const status = params.command.status || 'executed';

		return Promise.resolve()
			.then(() => {
				return this.migrator.getMigrationNames(status);
			})
			.then((names) => {
				return names && names.reverse();
			});
	};

Command.prototype._getTargetMigrationNames =
	function _getTargetMigrationNames(separated) {
		return separated.executedNames;
	};

Command.prototype._processSeparated = function _processSeparated(separated) {
	separated.newNames.forEach((name) => {
		this.logger.log(`Skip "${name}" because it's not executed yet`);
	});
};

Command.prototype._executeMigration = function _executeMigration(migration) {
	return Promise.resolve()
		.then(() => {
			if (migration.rollback) {
				this.logger.log(`Rollback "${migration.name}"`);

				return this.migrator.rollback(migration);
			} else {
				this.logger.log(
					`Skip "${migration.name}" because rollback function is not set`
				);
			}
		})
		.then(() => {
			if (migration.rollback) {
				this.logger.log('Migration successfully rolled back');
			}
		});
};
