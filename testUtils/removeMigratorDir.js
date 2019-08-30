'use strict';

const pathUtils = require('path');
const fse = require('fs-extra');
const removeMigrations = require('./removeMigrations');

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
			if (dirExists) {
				return removeMigrations({migrator, names});
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
