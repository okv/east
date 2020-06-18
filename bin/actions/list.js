const {inherits} = require('util');
const BaseAction = require('./base');

function Action(params) {
	BaseAction.call(this, params);
}
inherits(Action, BaseAction);

Action.prototype._execute = function _execute({status, tag}) {
	return Promise.resolve()
		.then(() => this.migrationManager.getMigrationNames({status, tag}))
		.then((names) => {
			if (names.length) {
				this.logger.info(`${status} migrations:`);
			} else {
				this.logger.info(`there are no ${status} migrations`);
			}

			names.forEach((name) => {
				this.logger.info('\t', name);
			});
		});
};

module.exports = Action;
