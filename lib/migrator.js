'use strict';

const _ = require('underscore');
const pathUtils = require('path');
const fse = require('fs-extra');
const ProgressBar = require('progress');
const utils = require('./utils');
const pMap = require('p-map');
const pProps = require('p-props');
const pify = require('pify');
const pTimeout = require('p-timeout');
const expressionify = require('expressionify');
const callbackify = require('callbackify');

/**
 * Main class
 */
function Migrator() {
}

Migrator.prototype.configure = function configure(params) {
	params = params || {};

	return Promise.resolve()
		.then(() => {
			this.params = {
				// migrations dir
				dir: pathUtils.resolve('migrations'),
				// execution timeout (one week by default - unreal)
				timeout: 7 * 24 * 60 * 60 * 1000,
				// adapter path to require
				adapter: './adapter',
				// db url
				url: null,
				// number format for migration filenames
				migrationNumberFormat: 'sequentialNumber',
				trace: false
			};

			return this._loadConfig(params.config);
		})
		.then((config) => {
			_(this.params).extend(config);

			_(this.params).extend(params);

			// create adapter
			this.adapter = this._createAdapter(this.params.adapter, this.params);

			// get default path to migration template from adapter
			if (!this.params.template) {
				this.params.template = this.adapter.getTemplatePath();
			}
		});
};

Migrator.prototype._loadConfig = function _loadConfig(configPath) {
	const defaultConfigPath = pathUtils.resolve('.eastrc');

	return Promise.resolve()
		.then(() => {
			if (!configPath) {
				return fse.pathExists(defaultConfigPath);
			}
		})
		.then((defaultConfigPathExists) => {
			if (configPath) {
				return pathUtils.resolve(configPath);
			} else {
				return defaultConfigPathExists ? defaultConfigPath : '';
			}
		})
		.then((path) => {
			if (path) {
				return fse.readJson(path).catch((readErr) => {
					try {
						// eslint-disable-next-line import/no-dynamic-require
						return require(path);
					} catch (requireErr) {
						throw new Error(
							`Error while loading config "${path}" as json:\n` +
							`${readErr.stack || readErr}\n\nand as script:\n` +
							`${requireErr.stack || requireErr}\n`
						);
					}
				});
			} else {
				return {};
			}
		})
		.then((config) => {
			if (_(config).isFunction()) {
				if (config.length === 1) {
					return pify(config)();
				} else {
					return Promise.resolve(config());
				}
			} else {
				return config;
			}
		});
};

Migrator.prototype._tryLoadAdapter = function _tryLoadAdapter(path) {
	try {
		// eslint-disable-next-line import/no-dynamic-require
		return require(path);
	} catch (err) {
		return err;
	}
};

Migrator.prototype._promisifyAdapter = function _promisifyAdapter(adapter) {
	if (adapter.connect && adapter.connect.length > 0) {
		adapter.connect = pify(adapter.connect);
	}

	if (adapter.disconnect && adapter.disconnect.length > 0) {
		adapter.disconnect = pify(adapter.disconnect);
	}

	if (
		adapter.getExecutedMigrationNames &&
		adapter.getExecutedMigrationNames.length > 0
	) {
		adapter.getExecutedMigrationNames = pify(adapter.getExecutedMigrationNames);
	}

	if (adapter.markExecuted && adapter.markExecuted.length > 1) {
		adapter.markExecuted = pify(adapter.markExecuted);
	}

	if (adapter.unmarkExecuted && adapter.unmarkExecuted.length > 1) {
		adapter.unmarkExecuted = pify(adapter.unmarkExecuted);
	}

	return adapter;
};

Migrator.prototype._createAdapter = function _createAdapter(adapter, params) {
	if (_(adapter).isFunction()) {
		try {
			// eslint-disable-next-line new-cap
			return new adapter(params);
		} catch (err) {
			throw new Error(`Error constructing adapter:${err.message}`);
		}
	}

	// try load adapter from migrator-related path first then from cwd-related
	const paths = [adapter, pathUtils.join(process.cwd(), adapter)];
	let Adapter;
	const errors = [];

	for (let i = 0; i < paths.length; i++) {
		Adapter = this._tryLoadAdapter(paths[i]);

		if (Adapter instanceof Error) {
			errors.push(Adapter);
		} else {
			break;
		}
	}

	// if adapter is not loaded put all error messages into throwing error
	if (Adapter instanceof Error) {
		const error = new Error('Error loading adapter from all paths:\n');

		errors.forEach((err) => {
			error.message += `\n${err.stack || err.message}\n`;
		});

		throw error;
	}

	return this._promisifyAdapter(new Adapter(params));
};

Migrator.prototype.isDirExists = function isDirExists() {
	return Promise.resolve()
		.then(() => {
			const migrationsDir = this.params.dir;
			return fse.pathExists(migrationsDir);
		});
};

Migrator.prototype.init = function init() {
	return Promise.resolve()
		.then(() => {
			return this.isDirExists();
		})
		.then((dirExists) => {
			const migrationsDir = this.params.dir;

			if (dirExists) {
				throw new Error(
					`Migration directory "${migrationsDir}" already exists`
				);
			}

			return fse.mkdir(migrationsDir);
		});
};

Migrator.prototype.create = function create(baseName) {
	return Promise.resolve()
		.then(() => {
			return this._getNextNumber();
		})
		.then((num) => {
			const name = `${num}_${baseName}`;
			const path = this.getMigrationPathByName(name);

			return pProps({
				name,
				copyResult: fse.copy(this.params.template, path)
			});
		})
		.then((result) => result.name);
};

Migrator.prototype.remove = function remove(name) {
	return Promise.resolve()
		.then(() => {
			const path = this.getMigrationPathByName(name);
			return fse.unlink(path);
		});
};

Migrator.prototype.getAllMigrationNames = function getAllMigrationNames() {
	return Promise.resolve()
		.then(() => {
			return fse.readdir(this.params.dir);
		})
		.then((paths) => {
			const names = paths
				.filter((fileName) => {
					return this._fileNameRegExp.test(fileName);
				})
				.sort((fileNameOne, fileNameTwo) => {
					return (
						this._getNumber(fileNameOne) - this._getNumber(fileNameTwo)
					);
				})
				.map(this.getMigrationNameByPath);

			return names;
		});
};

const nameRegExpStr = '^([0-9]+)_(.*)';
Migrator.prototype._nameRegExp = new RegExp(nameRegExpStr);
Migrator.prototype._fileNameRegExp = new RegExp(`${nameRegExpStr}\\.js$`);

// get number from name
Migrator.prototype._getNumber = function _getNumber(name) {
	const numParts = this._nameRegExp.exec(name);
	return numParts ? Number(numParts[1]) : 0;
};

// get basename from name
Migrator.prototype._getBaseName = function _getBaseName(name) {
	return this._nameRegExp.exec(name)[2];
};

Migrator.prototype._zeroPadNumber = function _zeroPadNumber(number, padding) {
	let paddedNumber = number.toString();
	while (paddedNumber.length < padding) {
		paddedNumber = `0${paddedNumber}`;
	}
	return paddedNumber;
};

Migrator.prototype._getDateTimeNumber = function _getDateTimeNumber() {
	const now = new Date();
	return Promise.resolve(
		now.getFullYear().toString() +
		this._zeroPadNumber(now.getMonth() + 1, 2) +
		this._zeroPadNumber(now.getDate(), 2) +
		this._zeroPadNumber(now.getHours(), 2) +
		this._zeroPadNumber(now.getMinutes(), 2) +
		this._zeroPadNumber(now.getSeconds(), 2)
	);
};

Migrator.prototype._getSequentialNumber = function _getSequentialNumber() {
	return Promise.resolve()
		.then(() => {
			return this.getAllMigrationNames();
		})
		.then((allNames) => {
			const lastNames = allNames[allNames.length - 1];
			const num = this._getNumber(lastNames) + 1;

			return num;
		});
};

Migrator.prototype._getNextNumber = function _getNextNumber() {
	if (this.params.migrationNumberFormat === 'dateTime') {
		return this._getDateTimeNumber();
	} else if (this.params.migrationNumberFormat === 'sequentialNumber') {
		return this._getSequentialNumber();
	} else {
		throw new Error(
			`Unrecognised number format: "${this.params.migrationNumberFormat}". ` +
			'Supported values are "dateTime" and "sequentialNumber".'
		);
	}
};

Migrator.prototype.getNewMigrationNames = function getNewMigrationNames() {
	return Promise.resolve()
		.then(() => {
			return pProps({
				allNames: this.getAllMigrationNames(),
				executedNames: this.adapter.getExecutedMigrationNames()
			});
		})
		.then((result) => {
			const executedNamesHash = _(result.executedNames).indexBy();

			const newNames = result.allNames.filter((name) => {
				return !_(executedNamesHash).has(name);
			});

			return newNames;
		});
};

Migrator.prototype._filterMigrationNamesByTag =
	function _filterMigrationNamesByTag(params) {
		return Promise.resolve()
			.then(() => {
				return pMap(params.names, (name) => {
					return this.loadMigration(name);
				}, {concurrency: 10});
			})
			.then((migrations) => {
				const names = [];

				const evalTagExpression = expressionify(params.tag, {
					operators: utils.booleanOperators
				});

				migrations.forEach((migration) => {
					const expressionResult = evalTagExpression({
						parseOperand: (operand) => {
							return (
								migration.tags &&
								_(migration.tags).contains(operand)
							);
						}
					});

					if (expressionResult) {
						names.push(migration.name);
					}
				});

				return {names};
			});
	};

Migrator.prototype.filterMigrationNames =
	function filterMigrationNames(params) {
		return Promise.resolve()
			.then(() => {
				if (params.by === 'tag') {
					return this._filterMigrationNamesByTag(params);
				} else {
					throw new Error(`Don't know how to filter by ${params.by}`);
				}
			});
	};

Migrator.prototype.getMigrationPathByName =
	function getMigrationPathByName(name) {
		return pathUtils.resolve(
			pathUtils.join(this.params.dir, `${name}.js`)
		);
	};

Migrator.prototype.getMigrationNameByPath =
	function getMigrationPathByName(path) {
		return pathUtils.basename(path, '.js');
	};

Migrator.prototype.getMigrationNames =
	function getMigrationNames(status) {
		return Promise.resolve()
			.then(() => {
				if (status === 'all') {
					return this.getAllMigrationNames();
				} else if (status === 'executed') {
					return this.adapter.getExecutedMigrationNames();
				} else if (status === 'new') {
					return this.getNewMigrationNames();
				} else {
					throw new Error(`Unrecognized status "${status}"`);
				}
			});
	};

Migrator.prototype.isMigrationExists = function isMigrationExists(name) {
	return Promise.resolve()
		.then(() => {
			const path = this.getMigrationPathByName(name);

			return fse.pathExists(path);
		});
};

// check that all migrations exists
Migrator.prototype.checkMigrationsExists =
	function checkMigrationsExists(names) {
		return Promise.resolve()
			.then(() => {
				return pMap(names, (name) => {
					return this.isMigrationExists(name);
				}, {concurrency: 10});
			})
			.then((existGroupResults) => {
				existGroupResults.forEach((migrationExists, index) => {
					if (!migrationExists) {
						const name = names[index];

						throw new Error(`Migration "${name}" doesn't exist`);
					}
				});
			});
	};

Migrator.prototype.validateMigration = function validateMigration(migration) {
	return Promise.resolve()
		.then(() => {
			if (!_(migration).isObject()) {
				throw new Error('migration is not an object');
			}

			if (!migration.migrate) {
				throw new Error('`migrate` function is not set');
			}

			if (!_(migration.migrate).isFunction()) {
				throw new Error('`migrate` is not a function');
			}

			if (migration.rollback && !_(migration.rollback).isFunction()) {
				throw new Error('`rollback` set but it\'s not a function');
			}

			if (migration.tags && !_(migration.tags).isArray()) {
				throw new Error('`tags` set but it\'s not an array');
			}

			return migration;
		});
};

Migrator.prototype.loadMigration = function loadMigration(name) {
	return Promise.resolve()
		.then(() => {
			// eslint-disable-next-line import/no-dynamic-require
			const migration = require(this.getMigrationPathByName(name));

			return this.validateMigration(migration);
		})
		.then((migration) => {
			migration.name = name;

			return migration;
		})
		.catch((err) => {
			err.message = (
				`Error during load of migration "${name}": ${err.message}`
			);

			throw err;
		});
};

Migrator.prototype.connect = function connect() {
	return Promise.resolve()
		.then(() => {
			return this.adapter.connect();
		})
		.then((params) => {
			this._migrationParams = params || {};

			// add helpers
			this._migrationParams.createBar = (total) => {
				const bar = new ProgressBar(
					'[:bar] :current / :total',
					{total, width: 30, incomplete: ' '}
				);
				return bar;
			};
		});
};

Migrator.prototype.disconnect = function disconnect() {
	return this.adapter.disconnect();
};

// execute action function
Migrator.prototype._executeAction = function _executeAction(action) {
	const executionPromise = Promise.resolve()
		.then(() => {
			if (action.length > 1) {
				const promisifiedAction = pify(action);

				return promisifiedAction(this._migrationParams);
			} else {
				return Promise.resolve(
					action(this._migrationParams)
				);
			}
		});

	const timeout = Number(this.params.timeout);
	const timeoutError = new Error(
		`Migration execution timeout exceeded (${timeout} ms)`
	);

	return pTimeout(executionPromise, timeout, timeoutError);
};

// execute some migration action (migrate or rollback)
Migrator.prototype._executeMigration =
	function _executeMigration(migration, action) {
		return Promise.resolve()
			.then(() => {
				return this._executeAction(migration[action]);
			})
			.then(() => {
				const promisesHash = {};

				if (migration.force) {
					promisesHash.executedNames = (
						this.adapter.getExecutedMigrationNames()
					);
				} else {
					if (action === 'migrate') {
						promisesHash.markExecutedResult = (
							this.adapter.markExecuted(migration.name)
						);
					} else {
						promisesHash.unmarkExecutedResult = (
							this.adapter.unmarkExecuted(migration.name)
						);
					}
				}

				return pProps(promisesHash);
			})
			.then((result) => {
				const promisesHash = {};

				if (result.executedNames) {
					const isExecuted = (
						_(result.executedNames).contains(migration.name)
					);

					if (action === 'migrate' && !isExecuted) {
						promisesHash.markExecutedResult = (
							this.adapter.markExecuted(migration.name)
						);
					} else if (action === 'rollback' && isExecuted) {
						promisesHash.unmarkExecutedResult = (
							this.adapter.unmarkExecuted(migration.name)
						);
					}
				}

				return pProps(promisesHash);
			})
			.catch((err) => {
				err.message = (
					`Error during ${action} "${migration.name}": ` +
					`${err.message}`
				);

				throw err;
			});
	};

Migrator.prototype.migrate = function migrate(migration) {
	return this._executeMigration(migration, 'migrate');
};

Migrator.prototype.rollback = function rollback(migration) {
	return this._executeMigration(migration, 'rollback');
};

// separate passed migrations on new and executed
Migrator.prototype.separateNames = function separateNames(names) {
	return Promise.resolve()
		.then(() => {
			return this.adapter.getExecutedMigrationNames();
		})
		.then((allExecutedNames) => {
			const allExecutedNamesHash = _(allExecutedNames).indexBy();
			const executedNames = [];
			const newNames = [];

			names.forEach((name) => {
				if (_(allExecutedNamesHash).has(name)) {
					executedNames.push(name);
				} else {
					newNames.push(name);
				}
			});

			return ({
				newNames,
				executedNames
			});
		});
};

// convert paths, full names, basenames or numbers to full names
Migrator.prototype.normalizeNames = function normalizeNames(names) {
	return Promise.resolve()
		.then(() => {
			return this.getAllMigrationNames();
		})
		.then((allNames) => {
			const numbersHash = {};
			const baseNamesHash = {};
			const namesHash = {};

			// build hashes
			allNames.forEach((name) => {
				namesHash[name] = name;

				const number = this._getNumber(name);
				if (!numbersHash[number]) {
					numbersHash[number] = [];
				}
				numbersHash[number].push(name);

				const baseName = this._getBaseName(name);
				if (!baseNamesHash[baseName]) {
					baseNamesHash[baseName] = [];
				}
				baseNamesHash[baseName].push(name);
			});

			const normalizedNames = names.map((name) => {
				name = pathUtils.basename(name, '.js');

				// check by full name (or path, coz `basename` removes dir)
				if (_(namesHash).has(name)) return name;

				// check by number
				const numberParts = /^[0-9]+$/.exec(name);
				const number = numberParts ? numberParts[0] : null;

				if (number) {
					if (_(numbersHash).has(number)) {
						if (numbersHash[name].length === 1) {
							return numbersHash[number][0];
						} else {
							throw new Error(
								`Specified migration name "${name}" is ambiguous: ` +
								`${numbersHash[number].join(', ')} please choose one`
							);
						}
					}
				} else {
				// check by base name
					const baseName = name;

					if (_(baseNamesHash).has(baseName)) {
						if (baseNamesHash[name].length === 1) {
							return baseNamesHash[baseName][0];
						} else {
							throw new Error(
								`Specified migration name "${name}" is ambiguous: ` +
								`${baseNamesHash[baseName].join(', ')} please choose one`
							);
						}
					}
				}

				return name;
			});

			return normalizedNames;
		});
};

Migrator.prototype.configure = callbackify(
	Migrator.prototype.configure
);

Migrator.prototype.isDirExists = callbackify(
	Migrator.prototype.isDirExists
);

Migrator.prototype.init = callbackify(
	Migrator.prototype.init
);

Migrator.prototype.create = callbackify(
	Migrator.prototype.create
);

Migrator.prototype.remove = callbackify(
	Migrator.prototype.remove
);

Migrator.prototype.getAllMigrationNames = callbackify(
	Migrator.prototype.getAllMigrationNames
);

Migrator.prototype.getNewMigrationNames = callbackify(
	Migrator.prototype.getNewMigrationNames
);

Migrator.prototype.filterMigrationNames = callbackify(
	Migrator.prototype.filterMigrationNames
);

Migrator.prototype.getMigrationPathByName = callbackify(
	Migrator.prototype.getMigrationPathByName
);

Migrator.prototype.getMigrationNameByPath = callbackify(
	Migrator.prototype.getMigrationNameByPath
);

Migrator.prototype.getMigrationNames = callbackify(
	Migrator.prototype.getMigrationNames
);

Migrator.prototype.isMigrationExists = callbackify(
	Migrator.prototype.isMigrationExists
);

Migrator.prototype.checkMigrationsExists = callbackify(
	Migrator.prototype.checkMigrationsExists
);

Migrator.prototype.validateMigration = callbackify(
	Migrator.prototype.validateMigration
);

Migrator.prototype.loadMigration = callbackify(
	Migrator.prototype.loadMigration
);

Migrator.prototype.connect = callbackify(
	Migrator.prototype.connect
);

Migrator.prototype.disconnect = callbackify(
	Migrator.prototype.disconnect
);

Migrator.prototype.migrate = callbackify(
	Migrator.prototype.migrate
);

Migrator.prototype.rollback = callbackify(
	Migrator.prototype.rollback
);

Migrator.prototype.separateNames = callbackify(
	Migrator.prototype.separateNames
);

Migrator.prototype.normalizeNames = callbackify(
	Migrator.prototype.normalizeNames
);


module.exports = Migrator;
