'use strict';

const pathUtils = require('path');

module.exports = function getMigrationPathByName(path) {
	return pathUtils.basename(path, '.js');
};
