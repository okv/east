'use strict';

const fs = require('fs');
const destroyMigrator = require('./destroyMigrator');

module.exports = (env) => {
	const dir = env.dir;
	const migrator = env.migrator;
	const configPath = env.configPath;
	const templatePath = env.templatePath;

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
