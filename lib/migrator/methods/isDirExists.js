'use strict';

const fse = require('fs-extra');

module.exports = function isDirExists() {
	return Promise.resolve()
		.then(() => {
			const migrationsDir = this.params.dir;
			return fse.pathExists(migrationsDir);
		});
};
