const _ = require('underscore');

module.exports = ({withCallbacMethods} = {}) => {
	const adapter = {};

	adapter.getTemplatePath = _.noop;

	if (withCallbacMethods) {
		adapter.connect = (callback) => callback;
		adapter.disconnect = (callback) => callback;
		adapter.getExecutedMigrationNames = (callback) => callback;
		adapter.markExecuted = (name, callback) => callback;
		adapter.unmarkExecuted = (name, callback) => callback;
	} else {
		adapter.connect = () => Promise.resolve();
		adapter.disconnect = () => Promise.resolve();
		adapter.getExecutedMigrationNames = () => Promise.resolve();
		adapter.markExecuted = (name) => Promise.resolve(name);
		adapter.unmarkExecuted = (name) => Promise.resolve(name);
	}

	return adapter;
};
