const _ = require('underscore');
const pProps = require('p-props');

const actionsHookHash = {
	migrate: {
		before: 'beforeMigrate',
		after: 'afterMigrate',
		error: 'migrateError'
	},
	rollback: {
		before: 'beforeRollback',
		after: 'afterRollback',
		error: 'rollbackError'
	}
};

// execute some migration action (migrate or rollback)
module.exports = function _executeMigration(migration, action) {
	let migrationParams;
	let hookParams;

	return Promise.resolve()
		.then(() => {
			migrationParams = _(this._migrationParams).clone();
			hookParams = {
				migration: _(migration).pick('name'),
				migrationParams
			};

			return this.hooks.trigger(
				actionsHookHash[action].before,
				[hookParams]
			);
		})
		.then(() => {
			return this._executeAction(migration[action], migrationParams);
		})
		.then(() => {
			const promisesHash = {};

			if (migration.force) {
				promisesHash.executedNames = (
					this.adapter.getExecutedMigrationNames()
				);
			} else if (action === 'migrate') {
				promisesHash.markExecutedResult = (
					this.adapter.markExecuted(migration.name)
				);
			} else {
				promisesHash.unmarkExecutedResult = (
					this.adapter.unmarkExecuted(migration.name)
				);
			}

			return pProps(promisesHash);
		})
		.then((result) => {
			const promisesHash = {};

			if (result.executedNames) {
				const isExecuted = (
					_(result.executedNames).contains(migration.name)
				);

				if (action === 'migrate' && !isExecuted) {
					promisesHash.markExecutedResult = (
						this.adapter.markExecuted(migration.name)
					);
				} else if (action === 'rollback' && isExecuted) {
					promisesHash.unmarkExecutedResult = (
						this.adapter.unmarkExecuted(migration.name)
					);
				}
			}

			return pProps(promisesHash);
		})
		.then(() => {
			return this.hooks.trigger(
				actionsHookHash[action].after,
				[hookParams]
			);
		})
		.catch((err) => {
			return this.hooks.trigger(
				actionsHookHash[action].error,
				[_({error: err}).defaults(hookParams)]
			).then(() => {
				// eslint-disable-next-line no-param-reassign
				err.message = (
					`Error during ${action} "${migration.name}": ` +
					`${err.message}`
				);

				throw err;
			});
		});
};
