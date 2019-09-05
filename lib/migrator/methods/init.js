'use strict';

const fse = require('fs-extra');

module.exports = function init() {
	return Promise.resolve()
		.then(() => {
			return this.isDirExists();
		})
		.then((dirExists) => {
			const migrationsDir = this.params.dir;

			if (dirExists) {
				throw new Error(
					`Migration directory "${migrationsDir}" already exists`
				);
			}

			return fse.mkdir(migrationsDir);
		});
};
