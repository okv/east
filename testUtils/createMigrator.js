const _ = require('underscore');
const Migrator = require('../lib/migrator');
const removeMigratorDir = require('./removeMigratorDir');

module.exports = ({
	configureParams = {},
	removeDirBefore = true,
	init = false,
	connect = false
}) => {
	const migrator = new Migrator();

	return Promise.resolve()
		.then(() => migrator.configure(_({
			migrationNumberFormat: 'sequentialNumber'
		}).extend(configureParams)))
		// always connect migrator coz `removeDirBefore` makes unmark executed
		.then(() => migrator.connect())
		.then(() => {
			if (removeDirBefore) return removeMigratorDir(migrator);
		})
		.then(() => {
			if (init) return migrator.init();
		})
		.then(() => {
			// disconnect if connected was not required
			if (!connect) return migrator.disconnect();
		})
		.then(() => migrator);
};
