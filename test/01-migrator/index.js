'use strict';

const _ = require('underscore');
const tap = require('tap');
const testUtils = require('../../testUtils');

tap.mochaGlobals();

describe('migrator', () => {
	let migrator;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrator({init: true, connect: true}))
			.then((createdMigrator) => {
				migrator = createdMigrator;
			});
	});

	after(() => testUtils.destroyMigrator({migrator}));

	describe('adapter', () => {
		// just log used adapter name, useful for integration testing with
		// different adapters
		it(`should have a name "${migrator.params.adapter}"`, _.noop);
	});
});
