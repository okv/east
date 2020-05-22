const _ = require('underscore');
const pathUtils = require('path');

module.exports = function _createAdapter(adapter, params) {
	return Promise.resolve()
		.then(() => {
			if (_(adapter).isFunction()) {
				try {
					// eslint-disable-next-line new-cap
					return this._promisifyAdapter(new adapter(params));
				} catch (err) {
					throw new Error(`Error constructing adapter:${err.message}`);
				}
			}

			// try load adapter from migrator-related path first then from cwd-related
			const paths = [adapter, pathUtils.join(process.cwd(), adapter)];

			return this._tryLoadModules(paths);
		})
		.then(({loadedModule, errors}) => {
			const Adapter = loadedModule;

			// if adapter is not loaded put all error messages into throwing error
			if (!Adapter) {
				const error = new Error('Error loading adapter from all paths:\n');

				errors.forEach((err) => {
					error.message += `\n${err.stack || err.message}\n`;
				});

				throw error;
			}

			return this._promisifyAdapter(new Adapter(params));
		});
};
