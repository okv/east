'use strict';

const _ = require('underscore');
const pProps = require('p-props');
const BaseCommand = require('commander').Command;
const inherits = require('util').inherits;
const MigrationManager = require('../../lib/migrationManager');

function Command(nameAndArgs, params) {
	params = params || {};
	nameAndArgs = nameAndArgs || '';

	const args = nameAndArgs.split(/ +/);
	const name = args.shift();

	BaseCommand.call(this, name);

	this.parseExpectedArgs(args);

	this._initParams = params.initParams;
}
inherits(Command, BaseCommand);

exports.Command = Command;

// eslint-disable-next-line no-shadow
Command.prototype.command = function command(command) {
	this.commands.push(command);

	command.parent = this;

	return command;
};

Command.prototype.asyncAction = function asyncAction(func) {
	const self = this;

	self.action(function action() {
		const args = _(arguments).toArray();

		Command.initialized = true;

		Promise.resolve()
			.then(() => {
				const initParams = _({}).extend(self._initParams);

				initParams.migratorParams = _(self.parent).pick(
					'config', 'dir', 'timeout', 'template', 'adapter',
					'url', 'trace', 'silent'
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
Command.prototype._initLogger = function _initLogger(params) {
	const logger = _({}).extend(console);

	logger.debug = params.trace ? logger.log : _.noop;

	if (params.silent) {
		logger.log = _.noop;
	}

	this.logger = logger;
};

Command.prototype.init = function init(params) {
	let migrationManager;

	return Promise.resolve()
		.then(() => {
			this._initLogger(this.parent);

			migrationManager = new MigrationManager();
			return migrationManager.configure(params.migratorParams);
		})
		.then(() => {
			const promisesObject = {
				migrationParams: migrationManager.getParams()
			};

			if (params.skipDirCheck) {
				promisesObject.dirExists = true;
			} else {
				promisesObject.dirExists = migrationManager.isMigrationsDirExist();
			}

			return pProps(promisesObject);
		})
		.then((result) => {
			const {dirExists, migrationParams} = result;

			if (!dirExists) {
				throw new Error(
					`Migrations directory: ${migrationParams.dir} doesn't exist. ` +
					'You should run `init` command to initialize migrations or change ' +
					'`dir` option.'
				);
			}

			this.logger.debug(
				'Current parameters: %s',
				JSON.stringify(migrationParams, null, 4)
			);

			this.migrationManager = migrationManager;
			// FIXME: do not expose migrator, all should be done via manager
			this.migrator = migrationManager.migrator;
		});
};

Command.prototype.onError = function onError(err) {
	if (this.trace || this.parent.trace) {
		this.logger.error(err.stack || err);
	} else {
		this.logger.error(err.message);
	}
};

Command.prototype._filterMigrationNames =
	function _filterMigrationNames(params) {
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

Command.prototype.execute = function execute(params) {
	return Promise.resolve()
		.then(() => {
			return this.migrationManager.connect();
		})
		.then(() => {
			return this._execute(params);
		})
		.then(() => {
			return this.migrationManager.disconnect();
		});
};

Command.isInitialized = function isInitialized() {
	return Boolean(Command.initialized);
};
