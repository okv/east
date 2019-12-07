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
	let templatePath;

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
			if (
				params.migratorParams &&
				params.migratorParams.configureParams &&
				params.migratorParams.configureParams.templateText
			) {
				templatePath = pathUtils.join(dir, 'template.js');

				return fse.writeFile(
					templatePath,
					params.migratorParams.configureParams.templateText
				);
			}
		})
		.then(() => {
			const migrationsDir = pathUtils.join(dir, 'migrations');

			return createEastrc({dir, configParams: {dir: migrationsDir}});
		})
		.then((createdConfigPath) => {
			configPath = createdConfigPath;

			const migratorParams = _(params.migratorParams).clone() || {};
			migratorParams.configureParams = (
				_(migratorParams.configureParams).clone() || {}
			);
			migratorParams.configureParams.config = configPath;
			if (migratorParams.configureParams.templateText) {
				migratorParams.configureParams.template = templatePath;
				delete migratorParams.configureParams.templateText;
			}

			return createMigrator(migratorParams);
		})
		.then((createdMigrator) => {
			migrator = createdMigrator;
		})
		.then(() => ({
			dir,
			migrator,
			configPath,
			templatePath
		}));
};
