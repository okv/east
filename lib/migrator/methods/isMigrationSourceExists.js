'use strict';

const fse = require('fs-extra');

module.exports = function isMigrationSourceExists(name) {
	return Promise.resolve()
		.then(() => {
			const path = this.getMigrationSourcePathByName(name);

			return fse.pathExists(path);
		});
};
