'use strict';

const _ = require('underscore');
const pProps = require('p-props');

// execute some migration action (migrate or rollback)
module.exports = function _executeMigration(migration, action) {
	return Promise.resolve()
		.then(() => {
			return this._executeAction(migration[action]);
		})
		.then(() => {
			const promisesHash = {};

			if (migration.force) {
				promisesHash.executedNames = (
					this.adapter.getExecutedMigrationNames()
				);
			} else {
				if (action === 'migrate') {
					promisesHash.markExecutedResult = (
						this.adapter.markExecuted(migration.name)
					);
				} else {
					promisesHash.unmarkExecutedResult = (
						this.adapter.unmarkExecuted(migration.name)
					);
				}
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
		.catch((err) => {
			err.message = (
				`Error during ${action} "${migration.name}": ` +
				`${err.message}`
			);

			throw err;
		});
};
