'use strict';

var path = require('path');

function Adapter(params) {
	this.params = params;
}

Adapter.prototype.getTemplatePath = function() {
	return path.join(__dirname, 'migrationTemplate.js');
};

module.exports = Adapter;
