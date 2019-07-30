'use strict';

const _ = require('underscore');
const pathUtils = require('path');

module.exports = function configure(params) {
	params = params || {};

	return Promise.resolve()
		.then(() => {
			this.params = {
				// migrations dir
				dir: pathUtils.resolve('migrations'),
				// execution timeout (one week by default - unreal)
				timeout: 7 * 24 * 60 * 60 * 1000,
				// adapter path to require
				adapter: '../../adapter',
				// db url
				url: null,
				// number format for migration filenames
				migrationNumberFormat: 'sequentialNumber',
				trace: false
			};

			return this._loadConfig(params.config);
		})
		.then((config) => {
			_(this.params).extend(config);

			_(this.params).extend(params);

			// create adapter
			this.adapter = this._createAdapter(this.params.adapter, this.params);

			// get default path to migration template from adapter
			if (!this.params.template) {
				this.params.template = this.adapter.getTemplatePath();
			}
		});
};
