const _ = require('underscore');

module.exports = function _createAdapter(adapter, params) {
	return Promise.resolve()
		.then(() => {
			if (_(adapter).isFunction()) {
				return adapter;
			} else {
				const adapterPath = this._resolveModulePath(adapter);
				return this._loadModule(adapterPath);
			}
		})
		.then((Adapter) => this._promisifyAdapter(new Adapter(params)))
		.catch((err) => {
			throw new Error(`Error during adapter creation: ${err.message}`);
		});
};
