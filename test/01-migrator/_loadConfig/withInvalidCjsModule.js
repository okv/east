const tap = require('tap');
const expect = require('expect.js');
const fs = require('fs');
const pathUtils = require('path');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator _loadConfig with invalid cjs module', () => {
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
					'notValid.exports = 1',
					'utf-8'
				);
			});
	});

	after(() => fs.promises.unlink(configPath));

	after(() => testUtils.destroyEnv(testEnv));

	it('should be called with error', () => {
		return Promise.resolve()
			.then(() => migrator._loadConfig({path: configPath, defaultPath: ''}))
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).match(new RegExp(
					`Error while loading config "${configPath}" as json:`
				));
				expect(err.message).match(new RegExp(
					'and as module:'
				));
			});
	});
});
