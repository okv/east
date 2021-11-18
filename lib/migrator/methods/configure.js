const _ = require('underscore');
const pathUtils = require('path');

module.exports = function configure(params = {}) {
	return Promise.resolve()
		.then(() => {
			this.params = {
				// migrations dir
				dir: pathUtils.resolve('migrations'),
				// file extension of migrations at dir
				migrationExtension: 'js',
				// dir with migration source files (for transpiled languages e.g. ts)
				sourceDir: null,
				// file extension of migrations at sourceDir
				sourceMigrationExtension: null,
				// execution timeout (one week by default - unreal)
				timeout: 7 * 24 * 60 * 60 * 1000,
				// adapter path to require
				adapter: pathUtils.resolve(__dirname, '..', '..', 'adapter.js'),
				// db url
				url: null,
				// number format for migration filenames
				migrationNumberFormat: 'sequentialNumber',
				trace: false,
				// whether to load or not config file
				loadConfig: _(params).has('loadConfig') ? params.loadConfig : true,
				// whether to support es modules or not
				esModules: _(params).has('esModules') ? params.esModules : false
			};

			if (this.params.loadConfig) {
				return this._loadConfig({path: params.config});
			}
		})
		.then((config) => {
			_(this.params).extend(config);

			_(this.params).extend(params);

			this.params.sourceDir = this.params.sourceDir || this.params.dir;
			this.params.sourceMigrationExtension =
				this.params.sourceMigrationExtension || this.params.migrationExtension;

			// create adapter
			return this._createAdapter(this.params.adapter, this.params);
		})
		.then((adapter) => {
			this.adapter = adapter;

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
