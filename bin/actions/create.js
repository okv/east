'use strict';

const inherits = require('util').inherits;
const pProps = require('p-props');
const BaseAction = require('./base');

function Action(params) {
	BaseAction.call(this, params);
}
inherits(Action, BaseAction);

Action.prototype.execute = function execute(params) {
	return Promise.resolve()
		.then(() => this.migrationManager.create(params.basename))
		.then((migration) => {
			return pProps({
				name: migration.name,
				path: this.migrationManager.getMigrationPath(migration.name, 'source')
			});
		})
		.then((migration) => {
			this.logger.info(
				`New migration \`${migration.name}\` created at ${migration.path}`
			);
		});
};

module.exports = Action;
