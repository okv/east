'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

const describeTitle = (
	'migrator getAllMigrationNames with invalid migration file type'
);

describe(describeTitle, () => {
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

	after(() => testUtils.destroyEnv(testEnv));

	it('should throw an error', () => {
		return Promise.resolve()
			.then(() => migrator.getAllMigrationNames('<invalid migration file type>'))
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).to.be.an(Error);
				expect(err.message).to.equal(
					'Invalid migration file type, expected "executable" or "source" ' +
					'but got "<invalid migration file type>"'
				);
			});
	});
});
