const tap = require('tap');
const expect = require('expect.js');
const fs = require('fs');
const pathUtils = require('path');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator _loadConfig with ES Module object', () => {
	let migrator;
	let testEnv;
	let configPath;

	before(() => {
		return Promise.resolve()
			.then(() => {
				return testUtils.createEnv({
					migratorParams: {
						init: false,
						configureParams: {esModules: true}
					}
				});
			})
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
				migrator = testEnv.migrator;
			});
	});

	before(() => {
		return Promise.resolve()
			.then(() => {
				// could be placed to any other dir
				configPath = pathUtils.join(testEnv.dir, 'config.mjs');
				return fs.promises.writeFile(
					configPath,
					'export default {adapter: "test"};',
					'utf-8'
				);
			});
	});

	after(() => fs.promises.unlink(configPath));

	after(() => testUtils.destroyEnv(testEnv));

	let config;

	it('should be called without errors', () => {
		return Promise.resolve()
			.then(() => migrator._loadConfig({path: configPath, defaultPath: ''}))
			.then((loadedConfig) => {
				config = loadedConfig;
			});
	});

	it('should return expected object', () => {
		expect(config).eql({adapter: 'test'});
	});
});
