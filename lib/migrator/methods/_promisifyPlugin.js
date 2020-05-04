const {promisify} = require('util');

module.exports = function _promisifyPlugin(plugin) {
	if (plugin.register && plugin.register.length > 1) {
		// eslint-disable-next-line no-param-reassign
		plugin.register = promisify(plugin.register);
	}

	return plugin;
};
