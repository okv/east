'use strict';

const pathUtils = require('path');
const fs = require('fs');
const {pathExists} = require('../lib/utils');
const removeMigrations = require('./removeMigrations');
const unmarkMigrationsExecuted = require('./unmarkMigrationsExecuted');

module.exports = (migrator) => {
	const {dir, sourceDir} = migrator.params;
	const migrationsFilePath = pathUtils.join(dir, '.migrations');
	let dirExists;
	let sourceDirExists;

	return Promise.resolve()
		.then(() => {
			return Promise.all([
				pathExists(dir),
				pathExists(sourceDir)
			]);
		})
		.then(([dirExistsResult, sourceDirExistsResult]) => {
			dirExists = dirExistsResult;
			sourceDirExists = sourceDirExistsResult;
		})
		.then(() => {
			const allMigrationPromises = [];
			if (dirExists) {
				allMigrationPromises.push(migrator.getAllMigrationNames('executable'));
			}
			if (sourceDirExists) {
				allMigrationPromises.push(migrator.getAllMigrationNames('source'));
			}
			return Promise.all(allMigrationPromises);
		})
		.then(([executableNames, sourceNames]) => {
			const namesSet = new Set();
			if (executableNames) executableNames.forEach((name) => namesSet.add(name));
			if (sourceNames) sourceNames.forEach((name) => namesSet.add(name));

			if (namesSet.size) {
				const names = Array.from(namesSet.values());
				return Promise.all([
					removeMigrations({migrator, names}),
					unmarkMigrationsExecuted({migrator, names})
				]);
			}
		})
		.then(() => {
			if (dirExists) {
				return pathExists(migrationsFilePath);
			}
		})
		.then((fileExists) => {
			if (fileExists) {
				return fs.promises.unlink(migrationsFilePath);
			}
		})
		.then(() => {
			const dirPathsSet = new Set();
			if (dirExists) dirPathsSet.add(dir);
			if (sourceDirExists) dirPathsSet.add(sourceDir);
			const dirPaths = Array.from(dirPathsSet.values());

			return Promise.all(
				dirPaths.map((dirPath) => fs.promises.rmdir(dirPath))
			);
		});
};
