const _ = require('underscore');

module.exports = (params) => {
	const register = params.register;
	const multiHook = params.multiHook;
	const beforeMigrate = params.beforeMigrate;
	const afterMigrate = params.afterMigrate;
	const migrateError = params.migrateError;
	const beforeRollback = params.beforeRollback;
	const afterRollback = params.afterRollback;
	const rollbackError = params.rollbackError;

	const plugin = {};

	if (register) {
		plugin.register = register;
	} else if (multiHook) {
		plugin.register = (registerParams) => {
			const migratorHooks = registerParams.migratorHooks;

			_(multiHook.actionNames).each((actionName) => {
				migratorHooks.on(actionName, (hookParams) => {
					return multiHook.handler(actionName, hookParams);
				});
			});
		};
	} else {
		plugin.register = (registerParams) => {
			const migratorHooks = registerParams.migratorHooks;

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
