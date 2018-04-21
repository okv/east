'use strict';

var pathUtils = require('path'),
	fs = require('fs'),
	fse = require('fs-extra'),
	ProgressBar = require('progress'),
	utils = require('./utils'),
	pMap = require('p-map'),
	pify = require('pify'),
	expressionify = require('expressionify');

/**
 * Main class
 */
function Migrator(params) {
	params = params || {};

	var self = this;

	self.params = {
		// migrations dir
		dir: pathUtils.resolve('migrations'),
		// execution timeout (one week by default - unreal)
		timeout: 7 * 24 * 60 * 60 * 1000,
		// adapter path to require
		adapter: './adapter',
		// db url
		url: null,
		trace: false
	};

	utils.extend(self.params, self._loadConfig(params.config));

	utils.extend(self.params, params);

	// create adapter
	self.adapter = self._createAdapter(self.params.adapter, self.params);

	// get default path to migration template from adapter
	if (!self.params.template) {
		self.params.template = this.adapter.getTemplatePath();
	}
}

Migrator.prototype._loadConfig = function(configPath) {
	if (configPath) {
		configPath = pathUtils.resolve(configPath);
	} else {
		var defaultConfigPath = pathUtils.resolve('.eastrc');
		configPath = fs.existsSync(defaultConfigPath) ? defaultConfigPath : '';
	}
	if (!configPath) return {};
	try {
		return JSON.parse(fs.readFileSync(configPath));
	} catch (readErr) {
		try {
			return require(configPath);
		} catch(requireErr) {
			throw new Error(
				'Error while loading config `' + configPath + '` as json:\n' +
				(readErr.stack || readErr.message) + '\n\n and as script:\n' +
				(requireErr.stack || requireErr.message) + '\n'
			);
		}
	}
};

Migrator.prototype._tryLoadAdapter = function(path) {
	try {
		return require(path);
	} catch (err) {
		return err;
	}
};

Migrator.prototype._createAdapter = function(adapter, params) {
	if (utils.isFunction(adapter)) {
		try {
			return new adapter(params);
		} catch (err) {
			throw new Error('Error constructing adapter:' + err.message);
		}
	}
	// try load adapter from migrator-related path first then from cwd-related
	var paths = [adapter, pathUtils.join(process.cwd(), adapter)],
		Adapter,
		errors = [];

	for (var i = 0; i < paths.length; i++) {
		Adapter = this._tryLoadAdapter(paths[i]);

		if (Adapter instanceof Error) {
			errors.push(Adapter);
		} else {
			break;
		}
	}

	// if adapter is not loaded put all error messages into throwing error
	if (Adapter instanceof Error) {
		var error = new Error('Error loading adapter from all paths:\n');

		errors.forEach(function(err) {
			error.message += '\n' + (err.stack || err.message) + '\n';
		});

		throw error;
	}

	return pify(new Adapter(params));
};

Migrator.prototype.isDirExists = function() {
	return Promise.resolve()
		.then(() => {
			const migrationsDir = this.params.dir;
			return fse.pathExists(migrationsDir);
		});
};

Migrator.prototype.init = function() {
	return Promise.resolve()
		.then(() => {
			return this.isDirExists();
		})
		.then((dirExists) => {
			const migrationsDir = this.params.dir;

			if (dirExists) {
				throw new Error(
					'Migration directory `' + migrationsDir + '` already exists'
				);
			}

			return fse.mkdir(migrationsDir);
		});
};

Migrator.prototype.create = function(baseName) {
	let name;

	return Promise.resolve()
		.then(() => {
			return this._getNextNumber();
		})
		.then((num) => {
			name = num + '_' + baseName;
			const path = this.getMigrationPathByName(name);

			return fse.copy(this.params.template, path);
		})
		.then(() => name);
};

Migrator.prototype.remove = function(name) {
	return Promise.resolve()
		.then(() => {
			const path = this.getMigrationPathByName(name);
			return fse.unlink(path);
		});
};

Migrator.prototype.getAllMigrationNames = function() {
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

var nameRegExpStr = '^([0-9]+)_(.*)';
Migrator.prototype._nameRegExp = new RegExp(nameRegExpStr);
Migrator.prototype._fileNameRegExp = new RegExp(nameRegExpStr + '\\.js$');

// get number from name
Migrator.prototype._getNumber = function(name) {
	var numParts = this._nameRegExp.exec(name);
	return numParts ? Number(numParts[1]) : 0;
};

// get basename from name
Migrator.prototype._getBaseName = function(name) {
	return this._nameRegExp.exec(name)[2];
};

Migrator.prototype._getNextNumber = function() {
	return Promise.resolve()
		.then(() => {
			return this.getAllMigrationNames();
		})
		.then((allNames) => {
			const lastNames = allNames[allNames.length - 1];
			const num = this._getNumber(lastNames);
			num++;

			return num;
		});
};

Migrator.prototype.getNewMigrationNames = function() {
	return Promise.resolve()
		.then(() => {
			// TODO: replace with object all
			return Promise.all([
				this.getAllMigrationNames(),
				this.adapter.getExecutedMigrationNames()
			]);
		})
		.then((result) => {
			const allNames = result[0];
			const executedNames = result[1];

			const executedNamesHash = {};
			executedNames.forEach((name) => {
				executedNamesHash[name] = 1;
			});

			const newNames = allNames.filter(function(name) {
				return (name in executedNamesHash === false);
			});

			return newNames;
		});
};

Migrator.prototype._filterMigrationNamesByTag = function(params) {
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
				var expressionResult = evalTagExpression({
					parseOperand: (operand) => {
						return (
							migration.tags &&
							migration.tags.indexOf(operand) !== -1
						);
					}
				});

				if (expressionResult) {
					names.push(migration.name);
				}
			});

			return {names: names};
		});
};

Migrator.prototype.filterMigrationNames = function(params) {
	return Promise.resolve()
		.then(() => {
			if (params.by === 'tag') {
				return this._filterMigrationNamesByTag(params);
			} else {
				throw new Error('Don`t know how to filter by ' + params.by);
			}
		});
};

Migrator.prototype.getMigrationPathByName = function(name) {
	return pathUtils.resolve(
		pathUtils.join(this.params.dir, name + '.js')
	);
};

Migrator.prototype.getMigrationNameByPath = function(path) {
	return pathUtils.basename(path, '.js');
};

Migrator.prototype.getMigrationNames = function(status) {
	return Promise.resolve()
		.then(() => {
			if (status === 'all') {
				return this.getAllMigrationNames();
			} else if (status === 'executed') {
				return this.adapter.getExecutedMigrationNames();
			} else if (status === 'new') {
				return this.getNewMigrationNames();
			} else {
				throw new Error('Unrecognized status `' + status + '`');
			}
		});
};

Migrator.prototype.isMigrationExists = function(name) {
	return Promise.resolve()
		.then(() => {
			var path = this.getMigrationPathByName(name);

			return fse.pathExists(path);
		});
};

// check that all migrations exists
Migrator.prototype.checkMigrationsExists = function(names) {
	return Promise.resolve()
		.then(() => {
			// TODO: maybe replcae on race or similar
			return pMap(names, (name) => {
				return this.isMigrationExists(name);
			}, {concurrency: 10});
		})
		.then((existGroupResults) => {
			existGroupResults.forEach((migrationExists, index) => {
				if (!migrationExists) {
					const name = names[index];

					throw new Error('Migration `' + name + '` doesn`t exist');
				}
			});
		});
};

Migrator.prototype.validateMigration = function(migration) {
	return Promise.resolve()
		.then(() => {
			if (!utils.isObject(migration)) {
				throw new Error('migration is not an object');
			}

			if (!migration.migrate) {
				throw new Error('`migrate` function is not set');
			}

			if (
				!utils.isFunction(migration.migrate) &&
				!utils.isAsyncFunction(migration.migrate)
			) {
				throw new Error('`migrate` is not a function');
			}

			if (
				migration.rollback &&
				!utils.isFunction(migration.rollback) &&
				!utils.isAsyncFunction(migration.rollback)
			) {
				throw new Error('`rollback` set but it`s not a function');
			}

			if (migration.tags && !utils.isArray(migration.tags)) {
				throw new Error('`tags` set but it`s not an array');
			}

			return migration;
		});
};

Migrator.prototype.loadMigration = function(name) {
	return Promise.resolve()
		.then(() => {
			const migration = require(this.getMigrationPathByName(name));

			return this.validateMigration(migration);
		})
		.then((migration) => {
			migration.name = name;

			return migration;
		})
		['catch']((err) => {
			err.message = (
				'Error during load of migration "' + name +
				'": ' + err.message
			);

			throw err;
		});
};

Migrator.prototype.connect = function() {
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
					{total: total, width: 30, incomplete: ' '}
				);
				return bar;
			};
		});
};

Migrator.prototype.disconnect = function() {
	return this.adapter.disconnect();
};

// execute action function
Migrator.prototype._executeAction = function(action) {
	// TODO: return back support for migration timeout
	return Promise.resolve()
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
};

// execute some migration action (migrate or rollback)
Migrator.prototype._executeMigration = function(migration, action) {
	return Promise.resolve()
		.then(() => {
			return this._executeAction(migration[action]);
		})
		.then(() => {
			const promises = [];

			if (migration.force) {
				promises.push(
					this.adapter.getExecutedMigrationNames()
				);
			} else {
				promises.push(null);

				if (action === 'migrate') {
					promises.push(
						this.adapter.markExecuted(migration.name)
					);
				} else {
					promises.push(
						this.adapter.unmarkExecuted(migration.name)
					);
				}
			}

			return Promise.all(promises);
		})
		.then((results) => {
			const executedNames = results[0];

			if (executedNames) {
				const isExecuted = executedNames.indexOf(migration.name) !== -1;

				if (action === 'migrate' && !isExecuted) {
					return this.adapter.markExecuted(migration.name);
				} else if (action === 'rollback' && isExecuted) {
					return this.adapter.unmarkExecuted(migration.name);
				}
			}
		})
		['catch']((err) => {
			err.message = (
				'Error during ' + action + ' "' + migration.name + '": ' +
				err.message
			);

			throw err;
		});
};

Migrator.prototype.migrate = function(migration) {
	return this._executeMigration(migration, 'migrate');
};

Migrator.prototype.rollback = function(migration) {
	return this._executeMigration(migration, 'rollback');
};

// separate passed migrations on new and executed
Migrator.prototype.separateNames = function(names) {
	return Promise.resolve()
		.then(() => {
			return this.adapter.getExecutedMigrationNames();
		})
		.then((allExecutedNames) => {
			const allExecutedNamesHash = {};
			allExecutedNames.forEach((name) => {
				allExecutedNamesHash[name] = 1;
			});

			var	executedNames = [],
				newNames = [];

			names.forEach((name) => {
				if (name in allExecutedNamesHash) {
					executedNames.push(name);
				} else {
					newNames.push(name);
				}
			});

			return ({
				newNames: newNames,
				executedNames: executedNames
			});

		});
};

// convert paths, full names, basenames or numbers to full names
Migrator.prototype.normalizeNames = function(names) {
	return Promise.resolve()
		.then(() => {
			return this.getAllMigrationNames();
		})
		.then((allNames) => {
			var numbersHash = {},
				baseNamesHash = {},
				namesHash = {};

			// build hashes
			allNames.forEach((name) => {
				namesHash[name] = name;

				var number = this._getNumber(name);
				if (!numbersHash[number]) {
					numbersHash[number] = [];
				}
				numbersHash[number].push(name);

				var baseName = this._getBaseName(name);
				if (!baseNamesHash[baseName]) {
					baseNamesHash[baseName] = [];
				}
				baseNamesHash[baseName].push(name);
			});

			var normalizedNames = names.map((name) => {
				name = pathUtils.basename(name, '.js');

				// check by full name (or path, coz `basename` removes dir)
				if (name in namesHash) return name;

				// check by number
				var numberParts = /^[0-9]+$/.exec(name),
					number = numberParts ? numberParts[0] : null;

				if (number) {
					if (number in numbersHash) {
						if (numbersHash[name].length == 1) {
							return numbersHash[number][0];
						} else {
							throw new Error(
								'Specified migration name `' + name + '` is ambiguous: ' +
								numbersHash[number].join(', ') + ' please choose one'
							);
						}
					}
				} else {
				// check by base name
					var baseName = name;

					if (baseName in baseNamesHash) {
						if (baseNamesHash[name].length == 1) {
							return baseNamesHash[baseName][0];
						} else {
							throw new Error(
								'Specified migration name `' + name + '` is ambiguous: ' +
								baseNamesHash[baseName].join(', ') + ' please choose one'
							);
						}
					}

				}

				return name;
			});

			return normalizedNames;
		});
};


module.exports = Migrator;
