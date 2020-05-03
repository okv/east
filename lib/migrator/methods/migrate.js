module.exports = function migrate(migration) {
	return this._executeMigration(migration, 'migrate');
};
