'use strict';

const _ = require('underscore');
const methods = require('./methods');
const properties = require('./properties');
const callbackifyMigratorPrototype = require('./callbackifyMigratorPrototype');

function Migrator() {
	this.hooks = this._createHooks();
}

_(Migrator.prototype).extend(methods);

_(Migrator.prototype).extend(properties);

callbackifyMigratorPrototype(Migrator);

module.exports = Migrator;
