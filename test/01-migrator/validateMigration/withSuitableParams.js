'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator validateMigration with suitable params', () => {
	let migrator;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv())
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
				migrator = testEnv.migrator;
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	const validateMigrationAndCheckError = (migration, errorMessage) => {
		return Promise.resolve()
			.then(() => migrator.validateMigration(migration))
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).eql(errorMessage);
			});
	};

	let migration;


	it('valid migration should be ok', () => {
		migration = testUtils.makeMigration();

		return migrator.validateMigration(migration);
	});

	let errorMessage;
	it('non object migration should fail', () => {
		errorMessage = 'migration is not an object';

		return validateMigrationAndCheckError(1, errorMessage);
	});

	it('migration without migrate function should fail', () => {
		migration = testUtils.makeMigration();
		delete migration.migrate;
		errorMessage = '`migrate` function is not set';

		return validateMigrationAndCheckError(migration, errorMessage);
	});

	it('migration with non function migrate should fail', () => {
		migration = testUtils.makeMigration();
		migration.migrate = 1;
		errorMessage = '`migrate` is not a function';

		return validateMigrationAndCheckError(migration, errorMessage);
	});

	it('migration without rollback should be ok', () => {
		migration = testUtils.makeMigration();
		delete migration.rollback;

		return migrator.validateMigration(migration);
	});

	it('migration with non function rollback should fail', () => {
		migration = testUtils.makeMigration();
		migration.rollback = 1;
		errorMessage = '`rollback` set but it\'s not a function';

		return validateMigrationAndCheckError(migration, errorMessage);
	});

	it('migration with non array tags should fail', () => {
		migration = testUtils.makeMigration();
		migration.tags = 1;
		errorMessage = '`tags` set but it\'s not an array';

		return validateMigrationAndCheckError(migration, errorMessage);
	});

	it('migration with tags array should be ok', () => {
		migration = testUtils.makeMigration();
		migration.tags = ['one', 'two'];

		return migrator.validateMigration(migration);
	});
});
