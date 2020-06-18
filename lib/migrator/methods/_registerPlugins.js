const _ = require('underscore');
const pMap = require('p-map');

module.exports = function _registerPlugins(plugins = [], pluginRegisterParams) {
	return pMap(plugins, (plugin) => {
		return Promise.resolve()
			.then(() => {
				if (_(plugin).isObject()) {
					return plugin;
				} else {
					const pluginPath = this._resolveModulePath(plugin);
					return this._loadModule(pluginPath);
				}
			})
			.then((loadedPlugin) => {
				return this._promisifyPlugin(loadedPlugin)
					.register(pluginRegisterParams);
			})
			.catch((err) => {
				throw new Error(`Error during plugin registration: ${err.message}`);
			});
	}, {concurrency: 1});
};
