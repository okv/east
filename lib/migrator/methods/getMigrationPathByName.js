'use strict';

const pathUtils = require('path');

module.exports = function getMigrationPathByName(name) {
	return pathUtils.resolve(
		pathUtils.join(this.params.dir, `${name}.${this.params.migrationExtension}`)
	);
};
