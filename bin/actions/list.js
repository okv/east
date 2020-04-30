'use strict';

const inherits = require('util').inherits;
const BaseAction = require('./base');

function Action(params) {
	BaseAction.call(this, params);
}
inherits(Action, BaseAction);

Action.prototype._execute = function _execute(params) {
	return Promise.resolve()
		.then(() => this.migrationManager.getMigrationNames(params))
		.then((names) => {
			if (names.length) {
				this.logger.info(`${params.status} migrations:`);
			} else {
				this.logger.info(`there is no ${params.status} migrations`);
			}

			names.forEach((name) => {
				this.logger.info('\t', name);
			});
		});
};

module.exports = Action;
