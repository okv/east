'use strict';

module.exports = (params) => {
	const register = params.register;
	const beforeMigrate = params.beforeMigrate;
	const afterMigrate = params.afterMigrate;
	const migrateError = params.migrateError;
	const beforeRollback = params.beforeRollback;
	const afterRollback = params.afterRollback;
	const rollbackError = params.rollbackError;

	const plugin = {};

	if (register) {
		plugin.register = register;
	} else {
		plugin.register = (registerParams) => {
			const migratorHooks = registerParams.migrator.hooks;

			if (beforeMigrate) migratorHooks.on('beforeMigrate', beforeMigrate);
			if (afterMigrate) migratorHooks.on('afterMigrate', afterMigrate);
			if (migrateError) migratorHooks.on('migrateError', migrateError);
			if (beforeRollback) migratorHooks.on('beforeRollback', beforeRollback);
			if (afterRollback) migratorHooks.on('afterRollback', afterRollback);
			if (rollbackError) migratorHooks.on('rollbackError', rollbackError);
		};
	}


	return plugin;
};
