const pathUtils = require('path');
const fs = require('fs');
const _ = require('underscore');
const pathExists = require('path-exists');
const getTestDirPath = require('./getTestDirPath');
const createMigrator = require('./createMigrator');
const createEastrc = require('./createEastrc');

module.exports = (params = {}) => {
	let dir;
	let migrator;
	let configPath;
	let templatePath;
	let packageJsonPath;

	return Promise.resolve()
		.then(() => {
			const testDir = getTestDirPath();
			dir = pathUtils.join(testDir, `env-${process.env.TAP_CHILD_ID}`);

			return pathExists(dir);
		})
		.then((dirExists) => {
			if (!dirExists) {
				return fs.promises.mkdir(dir);
			}
		})
		.then(() => {
			if (
				params.migratorParams &&
				params.migratorParams.configureParams &&
				params.migratorParams.configureParams.esModules
			) {
				packageJsonPath = pathUtils.join(dir, 'package.json');

				return fs.promises.writeFile(
					packageJsonPath,
					'{"type": "module"}',
					'utf-8'
				);
			}
		})
		.then(() => {
			if (
				params.migratorParams &&
				params.migratorParams.configureParams &&
				params.migratorParams.configureParams.templateText
			) {
				templatePath = pathUtils.join(dir, 'template.js');

				return fs.promises.writeFile(
					templatePath,
					params.migratorParams.configureParams.templateText,
					'utf-8'
				);
			}
		})
		.then(() => {
			const migrationsDir = pathUtils.join(dir, 'migrations');

			return createEastrc({
				dir,
				configParams: {
					dir: migrationsDir,
					migrationNumberFormat: 'sequentialNumber'
				}
			});
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
			if (migratorParams.configureParams.dir) {
				migratorParams.configureParams.dir = pathUtils.join(
					dir, migratorParams.configureParams.dir
				);
			}
			if (migratorParams.configureParams.sourceDir) {
				migratorParams.configureParams.sourceDir = pathUtils.join(
					dir, migratorParams.configureParams.sourceDir
				);
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
			templatePath,
			packageJsonPath
		}));
};
