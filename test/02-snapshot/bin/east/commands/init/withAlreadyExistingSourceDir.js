const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const describeTitle = 'bin/east init command with already existing source dir';

describe(describeTitle, () => {
	let commandErr;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv({
				migratorParams: {
					init: true,
					configureParams: {
						sourceDir: 'migrationsSource'
					}
				}
			}))
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	it('should be done with error', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`"${binPath}" init --source-dir migrationsSource`,
					{cwd: testEnv.dir}
				);
			})
			.then((commandResult) => {
				throw new Error(
					`Error expexted but result returned: ${commandResult.stdout}`
				);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err.code).equal(1);
				expect(err.stdout).not.ok();

				commandErr = err;
			});
	});

	it('stderr should match expected snapshot', () => {
		tap.matchSnapshot(
			testUtils.cleanSnapshotData(commandErr.stderr),
			'output'
		);
	});
});
