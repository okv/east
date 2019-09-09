'use strict';

const pify = require('pify');

module.exports = function _promisifyAdapter(adapter) {
	if (adapter.connect && adapter.connect.length > 0) {
		adapter.connect = pify(adapter.connect);
	}

	if (adapter.disconnect && adapter.disconnect.length > 0) {
		adapter.disconnect = pify(adapter.disconnect);
	}

	if (
		adapter.getExecutedMigrationNames &&
		adapter.getExecutedMigrationNames.length > 0
	) {
		adapter.getExecutedMigrationNames = pify(adapter.getExecutedMigrationNames);
	}

	if (adapter.markExecuted && adapter.markExecuted.length > 1) {
		adapter.markExecuted = pify(adapter.markExecuted);
	}

	if (adapter.unmarkExecuted && adapter.unmarkExecuted.length > 1) {
		adapter.unmarkExecuted = pify(adapter.unmarkExecuted);
	}

	return adapter;
};
