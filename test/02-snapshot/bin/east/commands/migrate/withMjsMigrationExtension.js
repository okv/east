const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');


tap.mochaGlobals();

// skip this test if es modules are not supported
if (!testUtils.isEsmSupported()) {
	tap.grepInvert = 1;
	tap.grep = [/.*/];
}

const describeTitle = 'bin/east migrate with mjs migration extension';

describe(describeTitle, () => {
	let commandResult;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv({
				migratorParams: {
					init: true,
					configureParams: {
						migrationExtension: 'mjs'
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
					`"${binPath}" migrate someMigrationName ` +
					'--es-modules --migration-extension mjs',
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
