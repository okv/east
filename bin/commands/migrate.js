'use strict';

const _ = require('underscore');
const BaseCommand = require('./base').Command;
const inherits = require('util').inherits;

function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._execute = function _execute(params) {
	return Promise.resolve()
		.then(() => {
			this.migrationManager.on('beforeMigrateOne', (event) => {
				this.logger.log(`Migrate "${event.migration.name}"`);
			});

			this.migrationManager.on('afterMigrateOne', () => {
				this.logger.log('Migration done');
			});

			this.migrationManager.on('onSkipMigration', (event) => {
				if (event.reason === 'canNotMigrateAlreadyExecuted') {
					this.logger.log(
						`Skip "${event.migration.name}" because it's already executed`
					);
				}
			});

			this.migrationManager.on('beforeMigrateMany', (event) => {
				const names = event.migrationNames;

				if (names.length) {
					this.logger.log(`Target migrations:\n\t${names.join('\n\t')}`);
				} else {
					this.logger.info('Nothing to migrate');
				}
			});

			return this.migrationManager.migrate({
				migrations: _(params.names).isEmpty() ? null : params.names,
				status: params.command.status,
				tag: params.command.tag,
				force: params.command.force
			});
		});
};
