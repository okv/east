'use strict';

const tap = require('tap');
const expect = require('expect.js');
const pEachSeries = require('p-each-series');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator create with sequential migration number format', () => {
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

	after(() => testUtils.removeMigrations({migrator, names}));

	after(() => testUtils.destroyMigrator({migrator}));

	it('should create migrations sequentially without errors', () => {
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
