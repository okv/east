'use strict';

const pify = require('pify');

module.exports = function _promisifyPlugin(plugin) {
	if (plugin.register && plugin.register.length > 1) {
		plugin.register = pify(plugin.register);
	}

	return plugin;
};
