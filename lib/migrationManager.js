'use strict';

const Migrator = require('./migrator');

function MigrationManager() {
	this.migrator = new Migrator();
}

MigrationManager.prototype.configure = function configure(params) {
	return this.migrator.configure(params);
};

MigrationManager.prototype.connect = function connect() {
	return this.migrator.connect();
};

MigrationManager.prototype.disconnect = function disconnect() {
	return this.migrator.disconnect();
};

MigrationManager.prototype._filterMigrationNames =
	function _filterMigrationNames(params) {
		return Promise.resolve()
			.then(() => {
				return this.migrator.filterMigrationNames({
					by: params.by,
					names: params.names,
					tag: params.tag
				});
			})
			.then((filterResult) => {
				return filterResult && filterResult.names;
			});
	};

MigrationManager.prototype.getMigrationNames =
	function getMigrationNames(params) {
		return Promise.resolve()
			.then(() => {
				const status = params.status || 'new';

				return this.migrator.getMigrationNames(status);
			})
			.then((names) => {
				if (params.tag) {
					return this._filterMigrationNames({
						by: 'tag',
						tag: params.tag,
						names
					});
				} else {
					return names;
				}
			});
	};

MigrationManager.prototype.getParams = function getParams() {
	return Promise.resolve(this.migrator.params);
};

MigrationManager.prototype.isMigrationsDirExist =
	function isMigrationsDirExist() {
		return this.migrator.isDirExists();
	};

module.exports = MigrationManager;
