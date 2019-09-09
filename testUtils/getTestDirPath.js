'use strict';

const pathUtils = require('path');

module.exports = () => {
	return pathUtils.resolve(__dirname, '../test');
};
