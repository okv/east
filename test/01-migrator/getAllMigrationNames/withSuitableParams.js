'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator getAllMigrationNames with suitable params', () => {
	let migrator;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrator({init: true, connect: true}))
			.then((createdMigrator) => {
				migrator = createdMigrator;
			});
	});

	let expectedNames = [];

	before(() => {
		return Promise.resolve()
			.then(() => {
				const baseNames = [];
				const zCharcode = 'z'.charCodeAt(0);

				for (let index = 0; index < 12; index++) {
					const baseName = String.fromCharCode(zCharcode - index);

					baseNames.push(baseName);
				}

				return testUtils.createMigrations({migrator, baseNames});
			})
			.then((migrationNames) => {
				expectedNames = migrationNames;
			});
	});

	after(() => testUtils.removeMigrations({migrator, names: expectedNames}));

	after(() => testUtils.destroyMigrator({migrator}));

	it('should return numeric sorted names', () => {
		return Promise.resolve()
			.then(() => migrator.getAllMigrationNames())
			.then((names) => expect(names).eql(expectedNames));
	});
});
