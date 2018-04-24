'use strict';

let BaseCommand = require('./action').Command,
	inherits = require('util').inherits;

function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._getDefaultMigrationNames = function (params) {
	const status = params.command.status || 'new';

	return this.migrator.getMigrationNames(status);
};

Command.prototype._getTargetMigrationNames = function (separated) {
	return separated.newNames;
};

Command.prototype._processSeparated = function (separated) {
	separated.executedNames.forEach((name) => {
		this.logger.log(`skip \`${name}\` because it\`s already executed`);
	});
};

Command.prototype._executeMigration = function (migration) {
	return Promise.resolve()
		.then(() => {
			this.logger.log(`migrate \`${migration.name}\``);

			return this.migrator.migrate(migration);
		})
		.then(() => {
			this.logger.log('migration done');
		});
};
