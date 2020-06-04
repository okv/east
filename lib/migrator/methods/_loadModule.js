const _ = require('underscore');

module.exports = function _loadModule(path) {
	const {esModules} = this.params;

	return Promise.resolve()
		.then(() => esModules ? import(path) : require(path))
		.then((loadedModule) => {
			let result = loadedModule.default || loadedModule;

			if (_(result).isObject() && !_(result).isFunction()) {
				result = _({}).extend(result);
			}

			return result;
		})
		.catch((err) => {
			throw new Error(
				`Error loading module "${path}":\n ${err.stack || err.message}`
			);
		});
};
