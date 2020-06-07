const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');


tap.mochaGlobals();

const describeTitle = 'bin/east migrate with ts migration extension';

describe(describeTitle, () => {
	let commandResult;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv({
				migratorParams: {
					init: true,
					configureParams: {
						migrationExtension: 'ts'
					}
				}
			}))
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;

				return testUtils.createMigrations({
					migrator: testEnv.migrator,
					baseNames: ['someMigrationName']
				});
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	it('should be done without error', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`node -r ts-node/register "${binPath}" migrate ` +
					'someMigrationName --migrationExtension ts',
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
