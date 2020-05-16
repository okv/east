const {inherits} = require('util');
const BaseAction = require('./base');

function Action(params) {
	BaseAction.call(this, params);
}
inherits(Action, BaseAction);

Action.prototype.execute = function execute({command}) {
	return Promise.resolve()
		.then(() => {
			const name = command.args.shift();
			throw new Error(`Unrecognized command "${name}"`);
		});
};

module.exports = Action;
