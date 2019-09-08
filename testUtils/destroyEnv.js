'use strict';

const fse = require('fs-extra');
const destroyMigrator = require('./destroyMigrator');

module.exports = (env) => {
	const dir = env.dir;
	const migrator = env.migrator;
	const configPath = env.configPath;

	return Promise.resolve()
		.then(() => destroyMigrator({migrator}))
		.then(() => {
			if (configPath) {
				return fse.unlink(configPath);
			}
		})
		.then(() => fse.rmdir(dir));
};
