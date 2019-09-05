'use strict';

const _ = require('underscore');
const pathUtils = require('path');
const callbackify = require('callbackify');
const methods = require('./methods');
const properties = require('./properties');

/**
 * Main class
 */
function Migrator() {
}

_(Migrator.prototype).extend(methods);

_(Migrator.prototype).extend(properties);

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
