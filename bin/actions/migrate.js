const _ = require('underscore');
const {inherits} = require('util');
const BaseAction = require('./base');

function Action(params) {
	BaseAction.call(this, params);

	// always trace errors for migrate command
	this.traceOnError = true;
}
inherits(Action, BaseAction);

Action.prototype._execute = function _execute({
	names, status, tag, force
}) {
	return Promise.resolve()
		.then(() => {
			this.migrationManager.on('beforeMigrateOne', (event) => {
				this.logger.log(`Migrate "${event.migration.name}"`);
			});

			this.migrationManager.on('afterMigrateOne', () => {
				this.logger.log('Migration done');
			});

			this.migrationManager.on('onSkipMigration', (event) => {
				if (event.reason === 'cannotMigrateAlreadyExecuted') {
					this.logger.log(
						`Skip "${event.migration.name}" because it's already executed`
					);
				}
			});

			this.migrationManager.on('beforeMigrateMany', (event) => {
				const {migrationNames} = event;

				if (migrationNames.length) {
					this.logger.log(
						`Target migrations:\n\t${migrationNames.join('\n\t')}`
					);
				} else {
					this.logger.info('Nothing to migrate');
				}
			});

			return this.migrationManager.migrate({
				migrations: _(names).isEmpty() ? null : names,
				status,
				tag,
				force
			});
		});
};

module.exports = Action;
