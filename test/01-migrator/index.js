const _ = require('underscore');
const tap = require('tap');
const testUtils = require('../../testUtils');

tap.mochaGlobals();

describe('migrator', () => {
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
			});
	});
	after(() => testUtils.destroyEnv(testEnv));

	describe('adapter', () => {
		// just log used adapter name, useful for integration testing with
		// different adapters
		it(`should have a name "${testEnv.migrator.params.adapter}"`, _.noop);
	});
});
