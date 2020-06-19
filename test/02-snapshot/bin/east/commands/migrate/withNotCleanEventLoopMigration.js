const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const describeTitle = 'bin/east with not clean event loop migration';

describe(describeTitle, () => {
	let commandResult;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => {
				const templateTextStrings = [
					'exports.migrate = function(client, done) {',
					'  setTimeout(() => console.log("timer done"), 60000);',
					'  done();',
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
			});
	});

	after(() => testUtils.destroyEnv(testEnv));

	it('should be done immediately without error by auto exit feature', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`"${binPath}" migrate someMigrationName`,
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
