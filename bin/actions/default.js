'use strict';

const inherits = require('util').inherits;
const BaseAction = require('./base');

function Action(params) {
	BaseAction.call(this, params);
}
inherits(Action, BaseAction);

Action.prototype.execute = function execute(params) {
	return Promise.resolve()
		.then(() => {
			const name = params.command.args.shift();
			throw new Error(`Unrecognized command \`${name}\``);
		});
};

module.exports = Action;
