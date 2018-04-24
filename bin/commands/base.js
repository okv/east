'use strict';

let BaseCommand = require('commander').Command,
	Migrator = require('../../lib/migrator'),
	utils = require('../../lib/utils'),
	inherits = require('util').inherits,
	Steppy = require('twostep').Steppy;

function Command(nameAndArgs, params) {
	params = params || {};
	nameAndArgs = nameAndArgs || '';
	let args = nameAndArgs.split(/ +/),
		name = args.shift();
	BaseCommand.call(this, name);

	this.parseExpectedArgs(args);

	this._initParams = params.initParams;
}
inherits(Command, BaseCommand);

exports.Command = Command;

Command.prototype.command = function (command) {
	this.commands.push(command);
	command.parent = this;
	return command;
};

Command.prototype.asyncAction = function (func) {
	const self = this;

	self.action(function () {
		const args = utils.slice(arguments);

		Command.initialized = true;

		Promise.resolve()
			.then(() => {
				const initParams = utils.extend({}, self._initParams);

				initParams.migratorParams = utils.pick(
					self.parent,
					[
						'config', 'dir', 'timeout', 'template', 'adapter',
						'url', 'trace', 'silent'
					]
				);

				return self.init(initParams);
			})
			.then(() => {
				return func.apply(self, args);
			})
			.then(() => {
				if (self.parent.exit) {
					process.exit();
				}
			})
			.catch((err) => {
				self.onError(err);
				process.exit(1);
			});
	});
};

/*
 * Init logger. Log levels: debug, log, info, error
 * `debug` could be enabled by --trace
 * `log` could be supressed by --silent
 * `info`, `error` will be shown anyway
 */
Command.prototype._initLogger = function (params) {
	const logger = utils.extend({}, console);

	logger.debug = params.trace ? logger.log : utils.noop;

	if (params.silent) {
		logger.log = utils.noop;
	}

	this.logger = logger;
};

Command.prototype.init = function (params) {
	let migrator;

	return Promise.resolve()
		.then(() => {
			this._initLogger(this.parent);

			migrator = new Migrator(params.migratorParams);

			if (params.skipDirCheck) {
				return true;
			} else {
				return migrator.isDirExists();
			}
		})
		.then((dirExists) => {
			if (!dirExists) {
				throw new Error(
					`Migrations directory: ${migrator.params.dir} doesn\`t exist. ` +
					'You should run `init` command to initialize migrations or change ' +
					'`dir` option.'
				);
			}

			this.logger.debug('current parameters:', migrator.params);

			this.migrator = migrator;
		});
};

Command.prototype.onError = function (err) {
	if (this.trace || this.parent.trace) {
		this.logger.error(err.stack || err);
	} else {
		this.logger.error(err.message);
	}
};

Command.prototype._filterMigrationNames = function (params) {
	return Promise.resolve()
		.then(() => {
			return this.migrator.filterMigrationNames({
				by: params.by,
				names: params.names,
				tag: params.tag
			});
		})
		.then((filterResult) => {
			return filterResult && filterResult.names;
		});
};

Command.prototype.execute = function (params) {
	return Promise.resolve()
		.then(() => {
			return this.migrator.connect();
		})
		.then(() => {
			return this._execute(params);
		})
		.then(() => {
			return this.migrator.disconnect();
		});
};

Command.isInitialized = function () {
	return Boolean(Command.initialized);
};
