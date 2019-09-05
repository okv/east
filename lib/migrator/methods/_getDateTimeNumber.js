'use strict';

const utils = require('../../utils');

module.exports = function _getDateTimeNumber() {
	const now = new Date();
	return Promise.resolve(
		now.getFullYear().toString() +
		utils.zeroPadNumber(now.getMonth() + 1, 2) +
		utils.zeroPadNumber(now.getDate(), 2) +
		utils.zeroPadNumber(now.getHours(), 2) +
		utils.zeroPadNumber(now.getMinutes(), 2) +
		utils.zeroPadNumber(now.getSeconds(), 2)
	);
};
