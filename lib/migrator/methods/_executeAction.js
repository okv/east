'use strict';

const pify = require('pify');
const pTimeout = require('p-timeout');

// execute action function
module.exports = function _executeAction(action, actionParams) {
	const executionPromise = Promise.resolve()
		.then(() => {
			if (action.length > 1) {
				const promisifiedAction = pify(action);

				return promisifiedAction(actionParams);
			} else {
				return Promise.resolve(
					action(actionParams)
				);
			}
		});

	const timeout = Number(this.params.timeout);
	const timeoutError = new Error(
		`Migration execution timeout exceeded (${timeout} ms)`
	);

	return pTimeout(executionPromise, timeout, timeoutError);
};
