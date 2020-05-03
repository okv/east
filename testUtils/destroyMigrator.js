const removeMigratorDir = require('./removeMigratorDir');

module.exports = (params) => {
	const migrator = params.migrator;

	return Promise.resolve()
		.then(() => migrator.disconnect())
		.then(() => removeMigratorDir(migrator))
		.then(() => migrator);
};
