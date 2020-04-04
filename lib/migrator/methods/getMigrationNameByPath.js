'use strict';

const pathUtils = require('path');

module.exports = function getMigrationNameByPath(path) {
	return pathUtils.basename(path, `.${this.params.migrationExtension}`);
};
