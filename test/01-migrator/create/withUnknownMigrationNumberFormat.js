const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator create with date time migration number format', () => {
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

	const baseNames = ['first', 'second', 'third'];
	let allNamesBefore;

	before(() => {
		migrator.params.migrationNumberFormat = 'unknown';

		return Promise.resolve()
			.then(() => migrator.getAllMigrationNames())
			.then((names) => {
				allNamesBefore = names;
			});
	});

	after(() => {
		migrator.params.migrationNumberFormat = 'sequentialNumber';
	});

	after(() => testUtils.destroyEnv(testEnv));

	it('should return an error', () => {
		return Promise.resolve()
			.then(() => testUtils.createMigrations({migrator, baseNames}))
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).eql(
					'Unrecognised number format: ' +
					`"${migrator.params.migrationNumberFormat}". ` +
					'Supported values are "dateTime" and "sequentialNumber".'
				);
			});
	});

	it('should not create any migrations', () => {
		return Promise.resolve()
			.then(() => migrator.getAllMigrationNames())
			.then((names) => {
				expect(names).eql(allNamesBefore);
			});
	});
});
