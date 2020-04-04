'use strict';

const fse = require('fs-extra');

module.exports = function isSourceDirExists() {
	return Promise.resolve()
		.then(() => {
			const migrationSourceFilesDir = this.params.sourceDir;

			return fse.pathExists(migrationSourceFilesDir);
		});
};
