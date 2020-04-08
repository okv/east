'use strict';

const fse = require('fs-extra');

module.exports = function isDirExists(migrationType = 'executable') {
	return Promise.resolve()
		.then(() => {
			const {dir} = this._getMigrationFileTypeParams(migrationType);
			return fse.pathExists(dir);
		});
};
