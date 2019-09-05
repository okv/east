'use strict';

module.exports = function rollback(migration) {
	return this._executeMigration(migration, 'rollback');
};
