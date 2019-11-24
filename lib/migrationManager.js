'use strict';

const EventEmitter = require('events');
const inherits = require('util').inherits;
const _ = require('underscore');
const pProps = require('p-props');
const pMap = require('p-map');
const pEachSeries = require('p-each-series');
const Migrator = require('./migrator');

function MigrationManager() {
	this.migrator = new Migrator();
	this.logger = console;
}

inherits(MigrationManager, EventEmitter);

MigrationManager.prototype.configure = function configure(params) {
	return this.migrator.configure(params);
};

MigrationManager.prototype.init = function init() {
	return this.migrator.init();
};

MigrationManager.prototype.create = function create(basename) {
	return Promise.resolve()
		.then(() => {
			// TODO: remove after removing of fallbackCommaSeparatedNames
			if (basename.indexOf(',') !== -1) {
				throw new Error('Basename should not contain commas');
			}

			return this.migrator.create(basename);
		})
		.then((name) => ({name}));
};

MigrationManager.prototype.getMigrationPath = function getMigrationPath(name) {
	return this.migrator.getMigrationPathByName(name);
};

MigrationManager.prototype.connect = function connect() {
	return this.migrator.connect();
};

MigrationManager.prototype.disconnect = function disconnect() {
	return this.migrator.disconnect();
};

MigrationManager.prototype._filterMigrationNames =
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

MigrationManager.prototype._fallbackCommaSeparatedNames =
	function _fallbackCommaSeparatedNames(names) {
		const length = names.length;

		if (length === 1) {
			names = names[0].split(',');

			if (names.length > length) {
				this.logger.info(
					'DEPRECATION WARNING: target migrations separated by comma will ' +
					'not be supported in future versions (use space instead)'
				);
			}
		}

		return names;
	};

MigrationManager.prototype.getMigrationNames =
	function getMigrationNames(params) {
		return Promise.resolve()
			.then(() => {
				if (params.migrations && params.status) {
					throw new Error(
						'`status` option cannot be used when particular ' +
						'migrations are specified'
					);
				}

				if (params.migrations) {
					const migrations = this._fallbackCommaSeparatedNames(
						params.migrations
					);

					return this.migrator.normalizeNames(migrations);
				} else {
					const status = params.status || 'all';

					return this.migrator.getMigrationNames(status);
				}
			})
			.then((names) => {
				if (params.tag) {
					return this._filterMigrationNames({
						by: 'tag',
						tag: params.tag,
						names
					});
				} else {
					return names;
				}
			})
			.then((names) => {
				if (params.reverseOrderResult) {
					return names.reverse();
				} else {
					return names;
				}
			});
	};

MigrationManager.prototype._validateMigrationNames =
	function _validateMigrationNames(names) {
		return Promise.resolve()
			.then(() => {
				return pProps({
					checkMigrationsExistsResult: (
						this.migrator.checkMigrationsExists(names)
					),
					names
				});
			})
			.then((result) => result.names);
	};

MigrationManager.prototype._makeMigrationEventEntity =
	function _makeMigrationEventEntity(migration) {
		const entity = _(migration).pick('name');

		entity.hasRollback = Boolean(migration.rollback);

		return entity;
	};

MigrationManager.prototype._migrate = function _migrate(migration) {
	return Promise.resolve()
		.then(() => {
			this.emit('beforeMigrateOne', {
				migration: this._makeMigrationEventEntity(migration)
			});

			return this.migrator.migrate(migration);
		})
		.then(() => {
			this.emit('afterMigrateOne', {
				migration: this._makeMigrationEventEntity(migration)
			});
		});
};

MigrationManager.prototype._loadMigrations = function _loadMigrations(names) {
	// TODO: move concurrency to vars
	return pMap(names, (name) => {
		return this.migrator.loadMigration(name);
	}, {concurrency: 10});
};

MigrationManager.prototype.migrate = function migrate(params) {
	let migrationNames;

	return Promise.resolve()
		.then(() => {
			let getParams;

			if (params.migrations) {
				getParams = _(params).pick('migrations', 'status', 'tag');
			} else {
				getParams = _(params).pick('status', 'tag');

				if (!getParams.status) {
					getParams.status = 'new';
				}
			}

			return this.getMigrationNames(getParams);
		})
		.then((names) => this._validateMigrationNames(names))
		.then((names) => {
			const promisesObject = {
				separated: this.migrator.separateNames(names)
			};

			if (params.force) {
				delete promisesObject.separated;
				promisesObject.names = names;
			}

			return pProps(promisesObject);
		})
		.then((result) => {
			if (result.separated) {
				this.emit('onSeparatedMigrateNames', {
					executedMigrationNames: result.separated.executedNames,
					newMigrationNames: result.separated.newNames
				});

				return result.separated.newNames;
			} else {
				return result.names;
			}
		})
		.then((names) => {
			migrationNames = _(names).isEmpty() ? [] : names;

			this.emit('beforeMigrateMany', {migrationNames});

			if (migrationNames.length) {
				return this._loadMigrations(migrationNames);
			}
		})
		.then((migrations) => {
			if (migrations) {
				return pEachSeries(migrations, (migration) => {
					migration.force = params.force;

					return this._migrate(migration);
				});
			}
		})
		.then(() => {
			this.emit('afterMigrateMany', {migrationNames});
		});
};

MigrationManager.prototype._rollback = function _rollback(migration) {
	return Promise.resolve()
		.then(() => {
			this.emit('beforeRollbackOne', {
				migration: this._makeMigrationEventEntity(migration)
			});

			return this.migrator.rollback(migration);
		})
		.then(() => {
			this.emit('afterRollbackOne', {
				migration: this._makeMigrationEventEntity(migration)
			});
		});
};

MigrationManager.prototype.rollback = function rollback(params) {
	let migrationNames;

	return Promise.resolve()
		.then(() => {
			let getParams;

			if (params.migrations) {
				getParams = _(params).pick('migrations', 'status', 'tag');
			} else {
				getParams = _(params).pick('status', 'tag');

				if (!getParams.status) {
					getParams.status = 'executed';
					getParams.reverseOrderResult = true;
				}
			}

			return this.getMigrationNames(getParams);
		})
		.then((names) => this._validateMigrationNames(names))
		.then((names) => {
			const promisesObject = {
				separated: this.migrator.separateNames(names)
			};

			if (params.force) {
				delete promisesObject.separated;
				promisesObject.names = names;
			}

			return pProps(promisesObject);
		})
		.then((result) => {
			if (result.separated) {
				this.emit('onSeparatedRollbackNames', {
					executedMigrationNames: result.separated.executedNames,
					newMigrationNames: result.separated.newNames
				});

				return result.separated.executedNames;
			} else {
				return result.names;
			}
		})
		.then((names) => {
			migrationNames = _(names).isEmpty() ? [] : names;

			this.emit('beforeRollbackMany', {migrationNames});

			if (migrationNames.length) {
				return this._loadMigrations(migrationNames);
			}
		})
		.then((migrations) => {
			if (migrations) {
				return pEachSeries(migrations, (migration) => {
					migration.force = params.force;

					return this._rollback(migration);
				});
			}
		})
		.then(() => {
			this.emit('afterRollbackMany', {migrationNames});
		});
};

MigrationManager.prototype.getParams = function getParams() {
	return Promise.resolve(this.migrator.params);
};

MigrationManager.prototype.isMigrationsDirExist =
	function isMigrationsDirExist() {
		return this.migrator.isDirExists();
	};

module.exports = MigrationManager;
