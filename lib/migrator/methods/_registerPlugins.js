const pathUtils = require('path');
const _ = require('underscore');
const pMap = require('p-map');

module.exports = function _registerPlugins(plugins = [], pluginRegisterParams) {
	return pMap(plugins, (plugin) => {
		if (_(plugin).isObject()) {
			try {
				this._promisifyPlugin(plugin);

				return plugin.register(pluginRegisterParams);
			} catch (err) {
				throw new Error(`Error register plugin: ${err.message}`);
			}
		}

		return Promise.resolve()
			.then(() => {
				const pluginPath = pathUtils.resolve(plugin);
				return this._loadModule(pluginPath);
			})
			.then((loadedPlugin) => {
				this._promisifyPlugin(loadedPlugin);
				return loadedPlugin.register(pluginRegisterParams);
			});
	}, {concurrency: 1});
};
