const tap = require('tap');
const expect = require('expect.js');
const fs = require('fs');
const pathUtils = require('path');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator _loadConfig with cjs module promise function', () => {
	let migrator;
	let testEnv;
	let configPath;

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

	before(() => {
		return Promise.resolve()
			.then(() => {
				// could be placed to any other dir
				configPath = pathUtils.join(testEnv.dir, 'config.js');
				return fs.promises.writeFile(
					configPath,
					'module.exports = () => {' +
					'	return new Promise((resolve) => {' +
					'		setTimeout(() => resolve({adapter: "test"}), 10)' +
					'	});' +
					'}',
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
