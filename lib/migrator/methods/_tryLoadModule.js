'use strict';

module.exports = function _tryLoadModule(path) {
	try {
		// eslint-disable-next-line import/no-dynamic-require
		return require(path);
	} catch (err) {
		return err;
	}
};
