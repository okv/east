'use strict';

const _ = require('underscore');
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
