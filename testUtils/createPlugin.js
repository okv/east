const _ = require('underscore');

module.exports = ({
	register, multiHook,
	beforeMigrate, afterMigrate, migrateError,
	beforeRollback, afterRollback, rollbackError
}) => {
	const plugin = {};

	if (register) {
		plugin.register = register;
	} else if (multiHook) {
		plugin.register = (registerParams) => {
			const {migratorHooks} = registerParams;

			_(multiHook.actionNames).each((actionName) => {
				migratorHooks.on(actionName, (hookParams) => {
					return multiHook.handler(actionName, hookParams);
				});
			});
		};
	} else {
		plugin.register = (registerParams) => {
			const {migratorHooks} = registerParams;

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
