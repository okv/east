'use strict';

const pathUtils = require('path');
const fse = require('fs-extra');
const getTestDirPath = require('./getTestDirPath');
const createMigrator = require('./createMigrator');
const createEastrc = require('./createEastrc');

module.exports = (params) => {
	params = params || {};

	let dir;
	let migratorParams;
	let migrator;

	return Promise.resolve()
		.then(() => {
			const testDir = getTestDirPath();
			dir = pathUtils.join(testDir, `env-${process.env.TAP_CHILD_ID}`);

			return fse.pathExists(dir);
		})
		.then((dirExists) => {
			migratorParams = params.migratorParams || {};
			migratorParams.configureParams = migratorParams.configureParams || {};
			migratorParams.configureParams.dir = pathUtils.join(dir, 'migrations');

			if (!dirExists) {
				return fse.mkdir(dir);
			}
		})
		.then(() => createMigrator(migratorParams))
		.then((createdMigrator) => {
			migrator = createdMigrator;
		})
		.then(() => createEastrc({dir, migrator}))
		.then((configPath) => ({dir, migrator, configPath}));
};
