'use strict';

var BaseCommand = require('./base').Command,
	inherits = require('util').inherits,
	Steppy = require('twostep').Steppy;

/**
 * Basic action (migrate or rollback) command
 */
function Command(nameAndArgs, params) {
	BaseCommand.call(this, nameAndArgs, params);
	// always trace errors for action commands
	this.trace = true;
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype._validateMigrationNames = function(params, callback) {
	var self = this;
	Steppy(
		function() {
			self.migrator.normalizeNames(params.names, this.slot());
		},
		function(err, names) {
			this.pass(names);
			self.migrator.checkMigrationsExists(names, this.slot());
		},
		callback
	);
};

Command.prototype._separateMigrationNames = function(params, callback) {
	var self = this;
	Steppy(
		function(err) {
			self.migrator.separateNames(params.names, this.slot());
		},
		function(err, separated) {
			this.pass(self._getTargetMigrationNames(separated));

			self._processSeparated(separated);
		},
		callback
	);
};

Command.prototype._execute = function(params, callback) {
	var self = this;
	Steppy(
		function() {
			if (params.names.length) {
				if (params.command.status) {
					throw new Error(
						'`status` option cannot be used when particular ' +
						'migrations are specified'
					);
				}

				var names = self._fallbackCommaSeparatedNames(params.names);
				self._validateMigrationNames({
					names: names,
					command: params.command
				}, this.slot());
			} else {
				self._getDefaultMigrationNames(params, this.slot());
			}
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
			if (params.command.force) {
				this.pass(names);
			} else {
				self._separateMigrationNames({
					names: names,
					command: params.command
				}, this.slot());
			}
		},
		function(err, names) {
			if (!names || !names.length) {
				self.logger.info('nothing to ' + self._name);
				return callback();
			}

			self.logger.log('target migrations' + ':\n\t' + names.join('\n\t'));

			var funcs = names.map(function(name) {
				return function() {
					var stepCallback = this.slot();
					self.migrator.loadMigration(name, function(err, migration) {
						if (err) return stepCallback(err);
						migration.force = params.command.force;
						self._executeMigration(migration, stepCallback);
					});
				};
			});
			funcs.push(this.slot());

			Steppy.apply(null, funcs);
		},
		callback
	);
};

Command.prototype._fallbackCommaSeparatedNames = function(names) {
	var length = names.length;
	if (length == 1) {
		names = names[0].split(',');
		if (names.length > length) this.logger.info(
			'DEPRECATION WARNING: target migrations separated by comma will ' +
			'not be supported in future versions (use space instead)'
		);
	}
	return names;
};
