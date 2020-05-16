const _ = require('underscore');
const {inherits} = require('util');
const BaseAction = require('./base');

function Action(params) {
	BaseAction.call(this, params);

	// always trace errors for rollback command
	this.traceOnError = true;
}
inherits(Action, BaseAction);

Action.prototype._execute = function _execute({
	names, status, tag, force
}) {
	return Promise.resolve()
		.then(() => {
			this.migrationManager.on('beforeRollbackOne', (event) => {
				this.logger.log(`Rollback "${event.migration.name}"`);
			});

			this.migrationManager.on('afterRollbackOne', () => {
				this.logger.log('Migration successfully rolled back');
			});

			this.migrationManager.on('onSkipMigration', (event) => {
				if (event.reason === 'cannotRollbackNotExecuted') {
					this.logger.log(
						`Skip "${event.migration.name}" because it's not executed yet`
					);
				} else if (event.reason === 'cannotRollbackWithoutRollback') {
					this.logger.log(
						`Skip "${event.migration.name}" because rollback function is not set`
					);
				}
			});

			this.migrationManager.on('beforeRollbackMany', (event) => {
				const {migrationNames} = event;

				if (migrationNames.length) {
					this.logger.log(
						`Target migrations:\n\t${migrationNames.join('\n\t')}`
					);
				} else {
					this.logger.info('Nothing to rollback');
				}
			});

			return this.migrationManager.rollback({
				migrations: _(names).isEmpty() ? null : names,
				status,
				tag,
				force
			});
		});
};

module.exports = Action;
