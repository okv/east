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
			let migrationsDirName = 'migrations';
			let sourceDirName = 'migrations';

			const eastrc = {};

			if (params.migratorParams && params.migratorParams.configureParams) {
				const {configureParams} = params.migratorParams;

				if (configureParams.dir) {
					migrationsDirName = configureParams.dir;
					delete configureParams.dir;
				}
				if (configureParams.sourceDir) {
					sourceDirName = configureParams.sourceDir;
					delete configureParams.sourceDir;
				}
				if (configureParams.migrationExtension) {
					eastrc.migrationExtension = configureParams.migrationExtension;
				}
				if (configureParams.sourceMigrationExtension) {
					eastrc.sourceMigrationExtension = configureParams.sourceMigrationExtension;
				}
			}

			eastrc.dir = pathUtils.join(dir, migrationsDirName);
			eastrc.sourceDir = pathUtils.join(dir, sourceDirName);

			return createEastrc({dir, configParams: eastrc});
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
