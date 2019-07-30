'use strict';

module.exports = function _tryLoadAdapter(path) {
	try {
		// eslint-disable-next-line import/no-dynamic-require
		return require(path);
	} catch (err) {
		return err;
	}
};
