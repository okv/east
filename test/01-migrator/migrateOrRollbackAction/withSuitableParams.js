'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator migrate or rollback action with suitable params', () => {
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

	const migration = testUtils.makeMigration();

	['migrate', 'rollback'].forEach((action) => {
		describe(action, () => {
			it('good migration should be ok', () => migrator[action](migration));

			it('migration which produce eror should pass it', () => {
				migration[action] = () => {
					throw new Error(`Test ${action} error`);
				};

				return Promise.resolve()
					.then(() => migrator[action](migration))
					.then((result) => {
						throw new Error(`Error expected, but got result: ${result}`);
					})
					.catch((err) => {
						expect(err).ok();
						expect(err).an(Error);
						expect(err.message).equal(
							`Error during ${action} "${migration.name
							}": Test ${action} error`
						);
					});
			});
		});
	});
});
