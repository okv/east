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
			this.migrationManager.on('beforeRollbackOne', (event) => {
				this.logger.log(`Rollback "${event.migration.name}"`);
			});

			this.migrationManager.on('afterRollbackOne', () => {
				this.logger.log('Migration successfully rolled back');
			});

			this.migrationManager.on('onSkipMigration', (event) => {
				if (event.reason === 'canNotRollbackNotExecuted') {
					this.logger.log(
						`Skip "${event.migration.name}" because it's not executed yet`
					);
				} else if (event.reason === 'canNotRollbackWithoutRollback') {
					this.logger.log(
						`Skip "${event.migration.name}" because rollback function is not set`
					);
				}
			});

			this.migrationManager.on('beforeRollbackMany', (event) => {
				const names = event.migrationNames;

				if (names.length) {
					this.logger.log(`Target migrations:\n\t${names.join('\n\t')}`);
				} else {
					this.logger.info('Nothing to rollback');
				}
			});

			return this.migrationManager.rollback({
				migrations: _(params.names).isEmpty() ? null : params.names,
				status: params.command.status,
				tag: params.command.tag,
				force: params.command.force
			});
		});
};
