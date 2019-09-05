'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator migrate with suitable params', () => {
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

	after(() => testUtils.removeMigrations({migrator, names}));

	after(() => testUtils.destroyMigrator({migrator}));

	it('should execute migration without errors', () => {
		return Promise.resolve()
			.then(() => migrator.loadMigration(names[0]))
			.then((migration) => migrator.migrate(migration));
	});

	it('migration should be listed as `executed` after that', () => {
		return Promise.resolve()
			.then(() => migrator.adapter.getExecutedMigrationNames())
			.then((executedNames) => expect(executedNames).eql([names[0]]));
	});

	it(
		'execution of the same migration with force flag should passes ' +
		'without errors',
		() => {
			return Promise.resolve()
				.then(() => migrator.loadMigration(names[0]))
				.then((migration) => {
					migration.force = true;

					return migrator.migrate(migration);
				});
		}
	);

	it('migration should still be listed as `executed`', () => {
		return Promise.resolve()
			.then(() => migrator.adapter.getExecutedMigrationNames())
			.then((executedNames) => expect(executedNames).eql([names[0]]));
	});
});
