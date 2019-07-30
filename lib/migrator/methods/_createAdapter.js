'use strict';

const _ = require('underscore');
const pathUtils = require('path');

module.exports = function _createAdapter(adapter, params) {
	if (_(adapter).isFunction()) {
		try {
			// eslint-disable-next-line new-cap
			return new adapter(params);
		} catch (err) {
			throw new Error(`Error constructing adapter:${err.message}`);
		}
	}

	// try load adapter from migrator-related path first then from cwd-related
	const paths = [adapter, pathUtils.join(process.cwd(), adapter)];
	let Adapter;
	const errors = [];

	for (let i = 0; i < paths.length; i++) {
		Adapter = this._tryLoadAdapter(paths[i]);

		if (Adapter instanceof Error) {
			errors.push(Adapter);
		} else {
			break;
		}
	}

	// if adapter is not loaded put all error messages into throwing error
	if (Adapter instanceof Error) {
		const error = new Error('Error loading adapter from all paths:\n');

		errors.forEach((err) => {
			error.message += `\n${err.stack || err.message}\n`;
		});

		throw error;
	}

	return this._promisifyAdapter(new Adapter(params));
};
