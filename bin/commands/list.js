'use strict';

var BaseCommand = require('./base').Command,
	inherits = require('util').inherits,
	Steppy = require('twostep').Steppy;

function Command(nameAndArgs) {
	BaseCommand.call(this, nameAndArgs);
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._execute = function(params, callback) {
	var self = this;
	Steppy(
		function() {
			self.migrator.getMigrationNames(params.status, this.slot());
		},
		function(err, names) {
			if (params.command.tag) {
				self._filterMigrationNames({
					by: 'tag',
					names: names,
					tag: params.command.tag
				}, this.slot());
			} else {
				this.pass(names);
			}
		},
		function(err, names) {
			if (names.length) {
				self.logger.info(params.status + ' migrations:');
			} else {
				self.logger.info('there is no ' + params.status + ' migrations');
			}
			names.forEach(function(name) {
				self.logger.info('\t', name);
			});
			this.pass(null);
		},
		callback
	);
};
