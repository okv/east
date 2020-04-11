'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const describeTitle =
	'bin/east create command with unsupported source migration extension';

describe(describeTitle, () => {
	let commandResult;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv({migratorParams: {init: true}}))
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	it('should be done with an error', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`"${binPath}" create someMigrationName --sourceMigrationExtension bruh`,
					{cwd: testEnv.dir}
				);
			})
			.then(
				(result) => {
					throw new Error(`Error expected, but got result: ${result}`);
				},
				(err) => {
					commandResult = err;
					expect(err.stderr).ok();
				}
			);
	});

	it('stdout should match expected snapshot', () => {
		tap.matchSnapshot(
			testUtils.cleanSnapshotData(commandResult.stderr),
			'output'
		);
	});
});
