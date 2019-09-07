'use strict';

const _ = require('underscore');
const Hook = require('mhook').Hook;
const methods = require('./methods');
const properties = require('./properties');
const callbackifyMigratorPrototype = require('./callbackifyMigratorPrototype');

function Migrator() {
	this.hooks = new Hook([
		'beforeMigrate',
		'afterMigrate',
		'migrateError',
		'beforeRollback',
		'afterRollback',
		'rollbackError'
	]);
}

_(Migrator.prototype).extend(methods);

_(Migrator.prototype).extend(properties);

callbackifyMigratorPrototype(Migrator);

module.exports = Migrator;
