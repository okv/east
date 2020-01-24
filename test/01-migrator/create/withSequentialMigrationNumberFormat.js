'use strict';

const tap = require('tap');
const expect = require('expect.js');
const pEachSeries = require('p-each-series');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator create with sequential migration number format', () => {
	let migrator;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => {
				return testUtils.createEnv({
					migratorParams: {init: true, connect: true}
				});
			})
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
				migrator = testEnv.migrator;
			});
	});

	const baseNames = ['first', 'second', 'third', 'second'];
	let names = [];

	after(() => testUtils.removeMigrations({migrator, names}));

	after(() => testUtils.destroyEnv(testEnv));

	it('should create migrations without errors', () => {
		return Promise.resolve()
			.then(() => testUtils.createMigrations({migrator, baseNames}))
			.then((migrationNames) => {
				names = migrationNames;
			});
	});

	it('created migrations should have sequential numbers', () => {
		const expectedNames = baseNames.map((baseName, index) => {
			return `${String(index + 1)}_${baseName}`;
		});

		expect(names).eql(expectedNames);
	});

	it('created migrations should exist', () => {
		return migrator.checkMigrationsExists(names);
	});

	it('created migrations should be loadable', () => {
		return pEachSeries(names, (name) => migrator.loadMigration(name));
	});

	it('created migrations should be listed as `new`', () => {
		return Promise.resolve()
			.then(() => migrator.getNewMigrationNames())
			.then((newNames) => expect(newNames).eql(names));
	});
});
