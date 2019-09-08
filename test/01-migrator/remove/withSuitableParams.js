'use strict';

const tap = require('tap');
const expect = require('expect.js');
const pMap = require('p-map');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator remove with suitable params', () => {
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

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrations({migrator, baseNames}))
			.then((migrationNames) => {
				names = migrationNames;
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

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
