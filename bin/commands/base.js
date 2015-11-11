'use strict';

var BaseCommand = require('commander').Command,
	Migrator = require('../../lib/migrator'),
	utils = require('../../lib/utils'),
	inherits = require('util').inherits,
	Steppy = require('twostep').Steppy;

function Command(nameAndArgs, params) {
	params = params || {};
	nameAndArgs = nameAndArgs || '';
	var args = nameAndArgs.split(/ +/),
		name = args.shift();
	BaseCommand.call(this, name);

	this.parseExpectedArgs(args);

	this._initParams = params.initParams;
}
inherits(Command, BaseCommand);

exports.Command = Command;

var originalCommand = Command.prototype.command;
Command.prototype.command = function(command) {
	if (command instanceof BaseCommand) {
		this.commands.push(command);
		command.parent = this;
		return command;
	} else {
		return originalCommand.apply(this, arguments);
	}
};

Command.prototype.asyncAction = function(func) {
	var self = this;
	self.action(function() {
		var args = utils.slice(arguments);
		Steppy(
			function() {
				self.migrator = self.init(self.parent, self._initParams);

				args.push(this.slot());
				func.apply(self, args);
			},
			function(err) {
				if (err) self.onError(err);
			}
		);
	});
};

Command.prototype.init = function(params, opts) {
	Command.initialized = true;

	opts = opts || {};
	var migrator = new Migrator(params);
	if (!opts.skipDirCheck && !migrator.isDirExists()) {
		handleError(new Error(
			'Migrations directory: ' + migrator.params.dir + ' doesn`t exist.\n' +
			'You should run `init` command to initialize migrations or change\n' +
			'`dir` option.'
		));
	}
	if (params.trace) console.log('current parameters', migrator.params);
	return migrator;
};

Command.prototype.onError = function(err) {
	if (this.trace || this.parent.trace) {
		console.log(err.stack || err);
	} else {
		console.log(err.message);
	}
	process.exit(1);
};

Command.prototype._filterMigrationNames = function(params, callback) {
	this.migrator.filterMigrationNames({
		by: params.by,
		names: params.names,
		tag: params.tag
	}, function(err, filterResult) {
		callback(err, filterResult && filterResult.names);
	});
};

Command.prototype.execute = function(params, callback) {
	var self = this;
	Steppy(
		function() {
			self.migrator.connect(this.slot());
		},
		function() {
			self._execute(params, this.slot());
		},
		function(err) {
			self.migrator.disconnect(function() {
				callback(err)
			});
		}
	);
};

Command.isInitialized = function() {
	return Boolean(Command.initialized);
};
