'use strict';

const fse = require('fs-extra');

module.exports = function remove(name) {
	return Promise.resolve()
		.then(() => {
			const path = this.getMigrationPathByName(name);
			return fse.unlink(path);
		});
};
