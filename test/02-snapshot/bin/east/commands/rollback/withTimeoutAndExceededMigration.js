const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const describeTitle = (
	'bin/east rollback with timeout and exceeded migration'
);

describe(describeTitle, () => {
	let commandErr;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => {
				const templateTextStrings = [
					'exports.migrate = function(client, done) {',
					'};',
					'exports.rollback = function(client, done) {',
					'  setTimeout(done, 200)',
					'};'
				];
				const templateText = templateTextStrings.join('\n');
				return testUtils.createEnv({
					migratorParams: {init: true, configureParams: {templateText}}
				});
			})
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;

				return testUtils.createMigrations({
					migrator: testEnv.migrator,
					baseNames: ['someMigrationName']
				});
			})
			.then((names) => {
				return testUtils.markMigrationsExecuted({
					migrator: testEnv.migrator,
					names
				});
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	it('should be done with error', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`"${binPath}" rollback someMigrationName --timeout 100`,
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
