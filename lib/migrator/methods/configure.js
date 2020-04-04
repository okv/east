'use strict';

const _ = require('underscore');
const pathUtils = require('path');

module.exports = function configure(params) {
	params = params || {};

	return Promise.resolve()
		.then(() => {
			this.params = {
				// migrations dir
				dir: null,
				// file extension of migrations at dir
				migrationExtension: null,
				// dir with migration source files (for transpiled languages e.g. ts)
				sourceDir: null,
				// file extension of migrations at sourceDir
				sourceMigrationExtension: null,
				// execution timeout (one week by default - unreal)
				timeout: 7 * 24 * 60 * 60 * 1000,
				// adapter path to require
				adapter: '../../adapter',
				// db url
				url: null,
				// number format for migration filenames
				migrationNumberFormat: 'sequentialNumber',
				trace: false,
				// whether to load or not config file
				loadConfig: _(params).has('loadConfig') ? params.loadConfig : true
			};


			if (this.params.loadConfig) {
				return this._loadConfig(params.config);
			}
		})
		.then((config) => {
			_(this.params).extend(config);

			_(this.params).extend(params);

			const setEqualByDefault = (obj, a, b, defaultVal) => {
				if (obj[a]) {
					if (!obj[b]) {
						obj[b] = obj[a];
					}
				} else if (obj[b]) {
					if (!obj[a]) {
						obj[a] = obj[b];
					}
				} else {
					obj[a] = defaultVal;
					obj[b] = defaultVal;
				}
			};

			const defaultDir = pathUtils.resolve('migrations');

			setEqualByDefault(this.params, 'dir', 'sourceDir', defaultDir);
			setEqualByDefault(
				this.params,
				'migrationExtension',
				'sourceMigrationExtension',
				'js'
			);

			// create adapter
			this.adapter = this._createAdapter(this.params.adapter, this.params);

			// get default path to migration template from adapter
			if (!this.params.template) {
				this.params.template = this.adapter.getTemplatePath(
					this.params.sourceMigrationExtension
				);
			}

			return this._registerPlugins(
				this.params.plugins,
				{migratorParams: this.params, migratorHooks: this.hooks}
			);
		});
};
