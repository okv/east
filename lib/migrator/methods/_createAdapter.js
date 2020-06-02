const _ = require('underscore');
const pathUtils = require('path');

module.exports = function _createAdapter(adapter, params) {
	if (_(adapter).isFunction()) {
		try {
			// eslint-disable-next-line new-cap
			return this._promisifyAdapter(new adapter(params));
		} catch (err) {
			throw new Error(`Error constructing adapter:${err.message}`);
		}
	}

	return Promise.resolve()
		.then(() => {
			const adapterPath = pathUtils.resolve(adapter);
			return this._loadModule(adapterPath);
		})
		.then((Adapter) => this._promisifyAdapter(new Adapter(params)));
};
