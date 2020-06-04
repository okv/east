const _ = require('underscore');
const pathUtils = require('path');

module.exports = function _createAdapter(adapter, params) {
	return Promise.resolve()
		.then(() => {
			if (_(adapter).isFunction()) {
				return adapter;
			} else {
				const adapterPath = pathUtils.resolve(adapter);
				return this._loadModule(adapterPath);
			}
		})
		.then((Adapter) => this._promisifyAdapter(new Adapter(params)))
		.catch((err) => {
			throw new Error(`Error during adapter creation: ${err.message}`);
		});
};
