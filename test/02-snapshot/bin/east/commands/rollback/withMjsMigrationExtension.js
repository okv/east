const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

// skip this test if es modules are not supported
if (!testUtils.isEsmSupported()) {
	tap.grepInvert = 1;
	tap.grep = [/.*/];
}

const describeTitle = 'bin/east rollback with mjs migration extension';

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
			})
			.then((names) => {
				return testUtils.markMigrationsExecuted({
					migrator: testEnv.migrator, names
				});
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	it('should be done without error', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`"${binPath}" rollback someMigrationName ` +
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
