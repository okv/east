'use strict';

const fse = require('fs-extra');

module.exports = function isMigrationExists(name) {
	return Promise.resolve()
		.then(() => {
			const path = this.getMigrationPathByName(name);

			return fse.pathExists(path);
		});
};
