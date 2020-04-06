'use strict';

const pathUtils = require('path');
const fse = require('fs-extra');
const removeMigrations = require('./removeMigrations');
const unmarkMigrationsExecuted = require('./unmarkMigrationsExecuted');

module.exports = (migrator) => {
	const migrationsFilePath = pathUtils.join(
		migrator.params.dir,
		'.migrations'
	);
	let dirExists;
	let sourceDirExists;

	return Promise.resolve()
		.then(() => {
			return Promise.all([
				fse.pathExists(migrator.params.dir),
				fse.pathExists(migrator.params.sourceDir)
			]);
		})
		.then(([dirExistsResult, sourceDirExistsResult]) => {
			dirExists = dirExistsResult;
			sourceDirExists = sourceDirExistsResult;
		})
		.then(() => {
			const allMigrations = [];
			if (dirExists) {
				allMigrations.push(migrator.getAllMigrationNames());
			}
			if (sourceDirExists) {
				allMigrations.push(migrator.getAllMigrationNames('source'));
			}
			return Promise.all(allMigrations);
		})
		.then((exeAndSourceNames) => {
			const names = new Set(exeAndSourceNames.flat());

			if (names.size) {
				return Promise.all([
					removeMigrations({migrator, names}),
					unmarkMigrationsExecuted({migrator, names})
				]);
			}
		})
		.then(() => {
			if (dirExists) {
				return fse.pathExists(migrationsFilePath);
			}
		})
		.then((fileExists) => {
			if (fileExists) {
				return fse.unlink(migrationsFilePath);
			}
		})
		.then(() => {
			const dirsToDelete = new Set();

			if (dirExists) {
				dirsToDelete.add(migrator.params.dir);
			}
			if (sourceDirExists) {
				dirsToDelete.add(migrator.params.sourceDir);
			}

			return Promise.all(
				[...dirsToDelete.values()].map((dir) => fse.rmdir(dir))
			);
		});
};
