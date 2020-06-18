const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator _loadConfig without config', () => {
	let migrator;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => {
				return testUtils.createEnv({migratorParams: {init: false}});
			})
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
				migrator = testEnv.migrator;
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	let config;

	it('should be called without errors', () => {
		return Promise.resolve()
			.then(() => migrator._loadConfig({defaultPath: ''}))
			.then((loadedConfig) => {
				config = loadedConfig;
			});
	});

	it('should return empty object', () => {
		expect(config).eql({});
	});
});
