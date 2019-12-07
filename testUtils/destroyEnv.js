'use strict';

const fse = require('fs-extra');
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
				return fse.unlink(configPath);
			}
		})
		.then(() => {
			if (templatePath) {
				return fse.unlink(templatePath);
			}
		})
		.then(() => fse.rmdir(dir));
};
