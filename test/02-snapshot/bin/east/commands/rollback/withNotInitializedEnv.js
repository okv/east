const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const describeTitle = 'bin/east rollback with not initialized env';

describe(describeTitle, () => {
	let commandErr;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv({migratorParams: {init: false}}))
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
					`"${binPath}" rollback`,
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

				commandErr = err;
			});
	});

	it('output should match expected snapshot', () => {
		const output = `${commandErr.stdout}\n${commandErr.stderr}`;

		tap.matchSnapshot(
			testUtils.cleanSnapshotData(output),
			'output'
		);
	});
});
