'use strict';

const _ = require('underscore');
const Migrator = require('../lib/migrator');
const removeMigratorDir = require('./removeMigratorDir');

// allow to enable config loading by env var, useful for integration
// testing with different adapters
const loadConfig = Boolean(Number(process.env.NODE_EAST_TEST_LOAD_CONFIG));

module.exports = (params) => {
	params = _({
		configureParams: {},
		removeDirBefore: true,
		init: false,
		connect: false
	}).extend(params);

	_(params.configureParams).defaults({
		loadConfig
	});

	const migrator = new Migrator();

	return Promise.resolve()
		.then(() => migrator.configure(params.configureParams))
		.then(() => {
			if (params.removeDirBefore) {
				return removeMigratorDir(migrator);
			}
		})
		.then(() => {
			if (params.init) {
				return migrator.init();
			}
		})
		.then(() => {
			if (params.connect) {
				return migrator.connect();
			}
		})
		.then(() => migrator);
};
