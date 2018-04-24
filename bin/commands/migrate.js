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
		const status = params.command.status || 'new';

		return this.migrator.getMigrationNames(status);
	};

Command.prototype._getTargetMigrationNames =
	function _getTargetMigrationNames(separated) {
		return separated.newNames;
	};

Command.prototype._processSeparated = function _processSeparated(separated) {
	separated.executedNames.forEach((name) => {
		this.logger.log(`skip \`${name}\` because it\`s already executed`);
	});
};

Command.prototype._executeMigration = function _executeMigration(migration) {
	return Promise.resolve()
		.then(() => {
			this.logger.log(`migrate \`${migration.name}\``);

			return this.migrator.migrate(migration);
		})
		.then(() => {
			this.logger.log('migration done');
		});
};
