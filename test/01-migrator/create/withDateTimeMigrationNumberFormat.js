'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator create with date time migration number format', () => {
	let migrator;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrator({init: true, connect: true}))
			.then((createdMigrator) => {
				migrator = createdMigrator;
			});
	});

	const baseNames = ['first', 'second', 'third'];
	let names = [];

	after(() => testUtils.removeMigrations({migrator, names}));

	after(() => testUtils.destroyMigrator({migrator}));

	before(() => {
		migrator.params.migrationNumberFormat = 'dateTime';
	});

	after(() => {
		migrator.params.migrationNumberFormat = 'sequentialNumber';
	});

	it('should create new files with a dateTime prefix', () => {
		return Promise.resolve()
			.then(() => testUtils.createMigrations({migrator, baseNames}))
			.then((migrationNames) => {
				names = migrationNames;
			});
	});

	it('created migrations should have a dateTime prefix', () => {
		names.forEach((name, index) => {
			expect(name).to.match(new RegExp(`^[0-9]{14}_${baseNames[index]}$`));
		});
	});
});
