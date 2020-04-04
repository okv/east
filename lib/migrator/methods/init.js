'use strict';

const fse = require('fs-extra');

module.exports = function init() {
	return Promise.resolve()
		.then(() => {
			return Promise.all([this.isDirExists(), this.isSourceDirExists()]);
		})
		.then(([dirExists, sourceDirExists]) => {
			const migrationsDir = this.params.dir;
			const sourcesDir = this.params.sourceDir;

			if (dirExists) {
				throw new Error(
					`Migration executables directory "${migrationsDir}" already exists`
				);
			}
			if (sourceDirExists) {
				throw new Error(
					`Migration sources directory "${sourcesDir}" already exists`
				);
			}
			return migrationsDir === sourcesDir
				? fse.mkdir(migrationsDir)
				: Promise.all([fse.mkdir(migrationsDir), fse.mkdir(sourcesDir)]);
		});
};
