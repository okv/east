'use strict';

const tap = require('tap');
const expect = require('expect.js');
const pMap = require('p-map');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator normalizeNames with suitable params', () => {
	let migrator;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrator({init: true, connect: true}))
			.then((createdMigrator) => {
				migrator = createdMigrator;
			});
	});

	const baseNames = ['first', 'second', 'third', 'second'];
	let names = [];

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrations({migrator, baseNames}))
			.then((migrationNames) => {
				names = migrationNames;
			});
	});

	after(() => testUtils.destroyMigrator({migrator}));

	it('expect remove without errors', () => {
		return testUtils.removeMigrations({migrator, names});
	});

	it('removed migrations should not exist', () => {
		return Promise.resolve()
			.then(() => {
				return pMap(names, (name) => {
					return migrator.isMigrationExists(name);
				});
			})
			.then((existResults) => {
				existResults.forEach((existResult) => {
					expect(existResult).equal(false);
				});
			});
	});
});
