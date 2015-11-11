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
				console.log(params.status + ' migrations:');
			} else {
				console.log('there is no ' + params.status + ' migrations');
			}
			names.forEach(function(name) {
				console.log('\t', name);
			});
		},
		callback
	);	
};
