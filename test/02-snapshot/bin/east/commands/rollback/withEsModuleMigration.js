const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

// skip this test if es modules are not supported
if (!testUtils.isEsmSupported()) {
	tap.grepInvert = 1;
	tap.grep = [/.*/];
}

describe('bin/east rollback with ES Module migration', () => {
	let commandResult;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv({
				migratorParams: {
					init: true,
					configureParams: {
						esModules: true,
						templateText: [
							'export const migrate = async (client) => {}',
							'export const rollback = async (client) => {}'
						].join('\n\n')
					}
				}
			}))
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;

				return testUtils.createMigrations({
					migrator: testEnv.migrator,
					baseNames: ['someMigrationName', 'anotherMigrationName']
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
					`"${binPath}" rollback --es-modules`,
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
