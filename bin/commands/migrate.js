'use strict';

const BaseCommand = require('./base').Command;
const inherits = require('util').inherits;

function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._execute = function _execute(params) {
	return Promise.resolve()
		.then(() => {
			return this.migrationManager.migrate({
				migrations: params.names,
				status: params.command.status,
				tag: params.command.tag,
				force: params.command.force
			});
		});
};
