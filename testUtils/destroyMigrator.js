const removeMigratorDir = require('./removeMigratorDir');

module.exports = ({migrator}) => {
	return Promise.resolve()
		.then(() => migrator.disconnect())
		.then(() => removeMigratorDir(migrator))
		.then(() => migrator);
};
