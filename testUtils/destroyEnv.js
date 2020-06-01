const fs = require('fs');
const destroyMigrator = require('./destroyMigrator');

module.exports = ({
	dir, migrator, configPath, templatePath, packageJsonPath
}) => {
	return Promise.resolve()
		.then(() => destroyMigrator({migrator}))
		.then(() => {
			if (configPath) {
				return fs.promises.unlink(configPath);
			}
		})
		.then(() => {
			if (templatePath) {
				return fs.promises.unlink(templatePath);
			}
		})
		.then(() => {
			if (packageJsonPath) {
				return fs.promises.unlink(packageJsonPath);
			}
		})
		.then(() => fs.promises.rmdir(dir));
};
