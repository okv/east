'use strict';

const pathUtils = require('path');

module.exports = function getMigrationSourceNameByPath(path) {
	return pathUtils.basename(path, `.${this.params.sourceMigrationExtension}`);
};
