const {inherits} = require('util');
const BaseAction = require('./base');

function Action(params) {
	BaseAction.call(this, params);
}
inherits(Action, BaseAction);

Action.prototype.execute = function execute() {
	return Promise.resolve()
		.then(() => {
			return this.migrationManager.init();
		})
		.then(() => {
			return this.migrationManager.getParams();
		})
		.then((migrationParams) => {
			const {dir, sourceDir} = migrationParams;

			if (sourceDir === dir) {
				this.logger.info(
					'initialization successfully done, migration files will be ' +
					`stored at "${dir}"`
				);
			} else {
				this.logger.info(
					'initialization successfully done, migration executable ' +
					`and source files will be stored at "${dir}" and "${sourceDir}" respectively`
				);
			}
		});
};

module.exports = Action;
