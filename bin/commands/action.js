'use strict';

let BaseCommand = require('./base').Command,
	inherits = require('util').inherits,
	pMap = require('p-map'),
	pEachSeries = require('p-each-series'),
	pProps = require('p-props');

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

Command.prototype._validateMigrationNames = function (params) {
	return Promise.resolve()
		.then(() => {
			return this.migrator.normalizeNames(params.names);
		})
		.then((names) => {
			return pProps({
				names,
				checkMigrationsExistsResult: (
					this.migrator.checkMigrationsExists(names)
				)
			});
		})
		.then((result) => result.names);
};

Command.prototype._separateMigrationNames = function (params) {
	return Promise.resolve()
		.then(() => {
			return this.migrator.separateNames(params.names);
		})
		.then((separated) => {
			this._processSeparated(separated);

			return this._getTargetMigrationNames(separated);
		});
};

Command.prototype._execute = function (params) {
	return Promise.resolve()
		.then(() => {
			if (params.names.length) {
				if (params.command.status) {
					throw new Error(
						'`status` option cannot be used when particular ' +
						'migrations are specified'
					);
				}

				const names = this._fallbackCommaSeparatedNames(params.names);

				return this._validateMigrationNames({
					names,
					command: params.command
				});
			} else {
				return this._getDefaultMigrationNames(params);
			}
		})
		.then((names) => {
			if (params.command.tag) {
				return this._filterMigrationNames({
					by: 'tag',
					names,
					tag: params.command.tag
				});
			} else {
				return names;
			}
		})
		.then((names) => {
			if (params.command.force) {
				return names;
			} else {
				return this._separateMigrationNames({
					names,
					command: params.command
				});
			}
		})
		.then((names) => {
			if (!names || !names.length) {
				this.logger.info(`nothing to ${this._name}`);

				return null;
			}

			this.logger.log(`${'target migrations' + ':\n\t'}${names.join('\n\t')}`);

			return pMap(names, (name) => {
				return this.migrator.loadMigration(name);
			}, {concurrency: 10});
		})
		.then((migrations) => {
			if (migrations) {
				return pEachSeries(migrations, (migration) => {
					migration.force = params.command.force;

					return this._executeMigration(migration);
				});
			}
		});
};

Command.prototype._fallbackCommaSeparatedNames = function (names) {
	const length = names.length;
	if (length == 1) {
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
