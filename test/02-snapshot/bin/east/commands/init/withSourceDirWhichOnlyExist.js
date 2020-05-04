const tap = require('tap');
const expect = require('expect.js');
const fs = require('fs');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const describeTitle = 'bin/east init command with source dir which only exist';

describe(describeTitle, () => {
	let commandResult;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv({
				migratorParams: {
					// this creates `dir` and `sourceDir`, but `dir will be
					// removed later`
					init: true,
					configureParams: {
						sourceDir: 'migrationsSource'
					}
				}
			}))
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
				// remove dir
				return fs.promises.rmdir(testEnv.migrator.params.dir);
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	it('should be done without error', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`"${binPath}" init --sourceDir migrationsSource`,
					{cwd: testEnv.dir}
				);
			})
			.then((result) => {
				expect(result.stderr).not.ok();

				commandResult = result;
			});
	});

	it('stdout should match expected snapshot', () => {
		tap.matchSnapshot(
			testUtils.cleanSnapshotData(commandResult.stdout),
			'output'
		);
	});
});
