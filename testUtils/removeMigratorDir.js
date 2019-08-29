'use strict';

const pathUtils = require('path');
const fse = require('fs-extra');

module.exports = (migrator) => {
	const migrationsFilePath = pathUtils.join(
		migrator.params.dir,
		'.migrations'
	);

	return Promise.resolve()
		.then(() => {
			return fse.pathExists(migrationsFilePath);
		})
		.then((fileExists) => {
			if (fileExists) {
				return fse.unlink(
					pathUtils.join(migrator.params.dir, '.migrations')
				);
			}
		})
		.then(() => {
			return fse.pathExists(migrator.params.dir);
		})
		.then((dirExists) => {
			if (dirExists) {
				return fse.rmdir(migrator.params.dir);
			}
		});
};
