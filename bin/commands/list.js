'use strict';

const BaseCommand = require('./base').Command;
const inherits = require('util').inherits;

function Command(nameAndArgs) {
	BaseCommand.call(this, nameAndArgs);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._execute = function _execute(params) {
	return Promise.resolve()
		.then(() => {
			return this.migrationManager.getMigrationNames({
				status: params.status,
				tag: params.command.tag
			});
		})
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
