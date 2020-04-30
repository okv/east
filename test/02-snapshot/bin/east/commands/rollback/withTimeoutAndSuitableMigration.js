'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const describeTitle = (
	'bin/east rollback with timeout and suitable migration'
);

describe(describeTitle, () => {
	let commandResult;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => {
				const templateTextStrings = [
					'exports.migrate = function(client, done) {',
					'};',
					'exports.rollback = function(client, done) {',
					'  setTimeout(done, 50)',
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

	it('should be done without error', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`"${binPath}" rollback someMigrationName --timeout 100`,
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
