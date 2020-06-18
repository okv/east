const _ = require('underscore');
const methods = require('./methods');
const properties = require('./properties');

function Migrator() {
	this.hooks = this._createHooks();
}

_(Migrator.prototype).extend(methods);

_(Migrator.prototype).extend(properties);

module.exports = Migrator;
