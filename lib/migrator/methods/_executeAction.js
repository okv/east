'use strict';

const pify = require('pify');
const pTimeout = require('p-timeout');

// execute action function
module.exports = function _executeAction(action) {
	const executionPromise = Promise.resolve()
		.then(() => {
			if (action.length > 1) {
				const promisifiedAction = pify(action);

				return promisifiedAction(this._migrationParams);
			} else {
				return Promise.resolve(
					action(this._migrationParams)
				);
			}
		});

	const timeout = Number(this.params.timeout);
	const timeoutError = new Error(
		`Migration execution timeout exceeded (${timeout} ms)`
	);

	return pTimeout(executionPromise, timeout, timeoutError);
};
