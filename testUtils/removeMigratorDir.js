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

	return Promise.resolve()
		.then(() => {
			return fse.pathExists(migrator.params.dir);
		})
		.then((exists) => {
			dirExists = exists;
		})
		.then(() => {
			if (dirExists) {
				return migrator.getAllMigrationNames();
			}
		})
		.then((names) => {
			if (names && names.length) {
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
			if (dirExists) {
				return fse.rmdir(migrator.params.dir);
			}
		});
};
