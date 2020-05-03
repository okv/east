const pathUtils = require('path');
const _ = require('underscore');
const pMap = require('p-map');

module.exports = function _registerPlugins(plugins = [], pluginRegisterParams) {
	const cwd = process.cwd();

	return pMap(plugins, (plugin) => {
		if (_(plugin).isObject()) {
			try {
				this._promisifyPlugin(plugin);

				return plugin.register(pluginRegisterParams);
			} catch (err) {
				throw new Error(`Error register plugin: ${err.message}`);
			}
		}

		// try load plugin from migrator-related path first then from cwd-related
		const paths = [plugin, pathUtils.join(cwd, plugin)];

		const loadModuleResult = this._tryLoadModules(paths);

		const loadedPlugin = loadModuleResult.loadedModule;

		// if plugin is not loaded put all error messages into throwing error
		if (loadedPlugin instanceof Error) {
			const error = new Error('Error loading plugin from all paths:\n');

			loadModuleResult.errors.forEach((err) => {
				error.message += `\n${err.stack || err.message}\n`;
			});

			throw error;
		}

		this._promisifyPlugin(loadedPlugin);

		return loadedPlugin.register(pluginRegisterParams);
	}, {concurrency: 1});
};
