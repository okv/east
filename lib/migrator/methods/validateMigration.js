const _ = require('underscore');

module.exports = function validateMigration(migration) {
	return Promise.resolve()
		.then(() => {
			if (!_(migration).isObject()) {
				throw new Error('migration is not an object');
			}

			if (!migration.migrate) {
				throw new Error('"migrate" function is not set');
			}

			if (!_(migration.migrate).isFunction()) {
				throw new Error('"migrate" is not a function');
			}

			if (migration.rollback && !_(migration.rollback).isFunction()) {
				throw new Error('"rollback" set but it\'s not a function');
			}

			if (migration.tags && !_(migration.tags).isArray()) {
				throw new Error('"tags" set but it\'s not an array');
			}

			return migration;
		});
};
