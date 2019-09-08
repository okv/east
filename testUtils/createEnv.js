'use strict';

const pathUtils = require('path');
const fse = require('fs-extra');
const _ = require('underscore');
const getTestDirPath = require('./getTestDirPath');
const createMigrator = require('./createMigrator');
const createEastrc = require('./createEastrc');

module.exports = (params) => {
	params = params || {};

	let dir;
	let migrator;
	let configPath;

	return Promise.resolve()
		.then(() => {
			const testDir = getTestDirPath();
			dir = pathUtils.join(testDir, `env-${process.env.TAP_CHILD_ID}`);

			return fse.pathExists(dir);
		})
		.then((dirExists) => {
			if (!dirExists) {
				return fse.mkdir(dir);
			}
		})
		.then(() => {
			const migrationsDir = pathUtils.join(dir, 'migrations');

			return createEastrc({dir, configParams: {dir: migrationsDir}});
		})
		.then((createdConfigPath) => {
			configPath = createdConfigPath;

			const migratorParams = _(params.migratorParams).clone() || {};
			migratorParams.configureParams = migratorParams.configureParams || {};
			migratorParams.configureParams.config = configPath;

			return createMigrator(migratorParams);
		})
		.then((createdMigrator) => {
			migrator = createdMigrator;
		})
		.then(() => ({dir, migrator, configPath}));
};
