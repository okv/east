'use strict';

const _ = require('underscore');
const pProps = require('p-props');
const MigrationManager = require('../../lib/migrationManager');

function Action(params = {}) {
	const opts = {};
	_(params.opts).each((value, key) => {
		if (!_(value).isUndefined()) opts[key] = value;
	});
	this.opts = opts;

	const loggerParams = _(opts).pick('trace', 'silent');
	this._initLogger(loggerParams);
}

/*
 * Init logger. Log levels: debug, log, info, error
 * `debug` could be enabled by --trace
 * `log` could be supressed by --silent
 * `info`, `error` will be shown anyway
 */
Action.prototype._initLogger = function _initLogger(params) {
	const logger = _({}).extend(console);

	logger.debug = params.trace ? logger.log : _.noop;

	if (params.silent) {
		logger.log = _.noop;
	}

	this.logger = logger;
};

Action.prototype.init = function init(params = {}) {
	let migrationManager;

	return Promise.resolve()
		.then(() => {
			migrationManager = new MigrationManager();

			const migratorParams = _(this.opts).pick(
				'config', 'dir', 'timeout', 'template', 'adapter',
				'url', 'trace', 'silent', 'sourceDir', 'migrationExtension',
				'sourceMigrationExtension'
			);
			return migrationManager.configure(migratorParams);
		})
		.then(() => {
			const promisesObject = {
				migrationParams: migrationManager.getParams()
			};

			if (params.skipDirCheck) {
				promisesObject.initialized = true;
			} else {
				promisesObject.initialized = migrationManager.isInitialized();
			}

			return pProps(promisesObject);
		})
		.then((result) => {
			const initialized = result.initialized;
			const migrationParams = result.migrationParams;

			if (!initialized) {
				const {dir, sourceDir} = migrationParams;

				if (sourceDir === dir) {
					throw new Error(
						`Migrations directory: ${dir} doesn't exist. ` +
						'You should run `init` command to initialize migrations or change ' +
						'`dir` option.'
					);
				} else {
					throw new Error(
						`Migration executable dir "${dir}" or ` +
						`source dir "${sourceDir}" dosn't exist. ` +
						'You should run "init" command to initialize migrations or ' +
						'change "dir", "sourceDir" options.'
					);
				}
			}

			this.logger.debug(
				'Current parameters: %s',
				JSON.stringify(migrationParams, null, 4)
			);

			this.migrationManager = migrationManager;
		});
};

Action.prototype.onError = function onError(err) {
	if (this.opts.trace || this.traceOnError) {
		this.logger.error(err.stack || err);
	} else {
		this.logger.error(err.message);
	}
	process.exit(1);
};

Action.prototype.execute = function execute(params) {
	return Promise.resolve()
		.then(() => {
			return this.migrationManager.connect();
		})
		.then(() => {
			return this._execute(params);
		})
		.then(() => {
			return this.migrationManager.disconnect();
		})
		.then(() => {
			if (this.opts.exits) process.exit();
		});
};

module.exports = Action;
