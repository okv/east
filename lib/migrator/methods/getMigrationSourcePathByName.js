'use strict';

const pathUtils = require('path');

module.exports = function getMigrationSourcePathByName(name) {
	return pathUtils.resolve(
		pathUtils.join(this.params.sourceDir, `${name}.${this.params.sourceMigrationExtension}`)
	);
};
