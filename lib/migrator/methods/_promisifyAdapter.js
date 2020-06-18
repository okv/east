const {promisify} = require('util');

module.exports = function _promisifyAdapter(adapter) {
	if (adapter.connect && adapter.connect.length > 0) {
		// eslint-disable-next-line no-param-reassign
		adapter.connect = promisify(adapter.connect);
	}

	if (adapter.disconnect && adapter.disconnect.length > 0) {
		// eslint-disable-next-line no-param-reassign
		adapter.disconnect = promisify(adapter.disconnect);
	}

	if (
		adapter.getExecutedMigrationNames &&
		adapter.getExecutedMigrationNames.length > 0
	) {
		// eslint-disable-next-line no-param-reassign
		adapter.getExecutedMigrationNames = promisify(
			adapter.getExecutedMigrationNames
		);
	}

	if (adapter.markExecuted && adapter.markExecuted.length > 1) {
		// eslint-disable-next-line no-param-reassign
		adapter.markExecuted = promisify(adapter.markExecuted);
	}

	if (adapter.unmarkExecuted && adapter.unmarkExecuted.length > 1) {
		// eslint-disable-next-line no-param-reassign
		adapter.unmarkExecuted = promisify(adapter.unmarkExecuted);
	}

	return adapter;
};
