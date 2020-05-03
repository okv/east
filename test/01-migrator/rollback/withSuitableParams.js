const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator rollback with suitable params', () => {
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

	after(() => testUtils.removeMigrations({migrator, names}));

	after(() => testUtils.destroyEnv(testEnv));

	it('rollback executed migration without errors', () => {
		return Promise.resolve()
			.then(() => migrator.loadMigration(names[0]))
			.then((migration) => migrator.rollback(migration));
	});

	it('expect that no `executed` migration at list', () => {
		return Promise.resolve()
			.then(() => migrator.adapter.getExecutedMigrationNames())
			.then((executedNames) => expect(executedNames).have.length(0));
	});

	it('expect that all migrations lists as `new` again', () => {
		return Promise.resolve()
			.then(() => migrator.getNewMigrationNames())
			.then((newNames) => expect(newNames).eql(names));
	});
});
