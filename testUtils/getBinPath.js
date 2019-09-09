'use strict';

const pathUtils = require('path');

module.exports = (fileName) => {
	return pathUtils.resolve(
		__dirname,
		`../bin/${fileName}`
	);
};
