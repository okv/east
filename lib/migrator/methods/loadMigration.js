
module.exports = function loadMigration(name) {
	return Promise.resolve()
		.then(() => this._loadModule(this.getMigrationPathByName(name)))
		.then((migration) => this.validateMigration(migration))
		.then((migration) => {
			// eslint-disable-next-line no-param-reassign
			migration.name = name;

			return migration;
		})
		.catch((err) => {
			// eslint-disable-next-line no-param-reassign
			err.message = (
				`Error during load of migration "${name}": ${err.message}`
			);

			throw err;
		});
};
