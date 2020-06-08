const _ = require('underscore');

module.exports = function _executeMigration(migration) {
	let migrationParams;
	let hookParams;

	return Promise.resolve()
		.then(() => {
			migrationParams = _(this._migrationParams).clone();
			hookParams = {
				migration: _(migration).pick('name'),
				migrationParams
			};

			return this.hooks.trigger('beforeRollback', [hookParams]);
		})
		.then(() => this._executeAction(migration.rollback, migrationParams))
		.then(() => {
			const promises = [];

			if (migration.force) {
				promises.push(this.adapter.getExecutedMigrationNames());
			} else {
				// put executed names as zero arg
				promises.push(null, this.adapter.unmarkExecuted(migration.name));
			}

			return Promise.all(promises);
		})
		.then(([executedNames]) => {
			if (executedNames) {
				const isExecuted = _(executedNames).contains(migration.name);

				if (isExecuted) {
					return this.adapter.unmarkExecuted(migration.name);
				}
			}
		})
		.then(() => this.hooks.trigger('afterRollback', [hookParams]))
		.catch((err) => {
			return this.hooks.trigger(
				'rollbackError',
				[_({error: err}).defaults(hookParams)]
			).then(() => {
				// eslint-disable-next-line no-param-reassign
				err.message = (
					`Error during rollback "${migration.name}": ` +
					`${err.message}`
				);

				throw err;
			});
		});
};
