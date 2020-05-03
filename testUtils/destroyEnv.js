const fs = require('fs');
const destroyMigrator = require('./destroyMigrator');

module.exports = ({
	dir, migrator, configPath, templatePath
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
		.then(() => fs.promises.rmdir(dir));
};
