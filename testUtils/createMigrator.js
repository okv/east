'use strict';

const _ = require('underscore');
const Migrator = require('../lib/migrator');
const removeMigratorDir = require('./removeMigratorDir');

module.exports = (params) => {
	params = _(params).defaults({
		configureParams: {},
		removeDirBefore: true,
		init: false,
		connect: false
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
