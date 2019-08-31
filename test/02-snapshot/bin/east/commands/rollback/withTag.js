'use strict';

const tap = require('tap');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const binPath = testUtils.getBinPath('east');
const describeTitle = 'bin/east rollback with tag';

describe(describeTitle, () => {
	let commandResult;
	let migrator;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrator({init: true}))
			.then((createdMigrator) => {
				migrator = createdMigrator;

				return testUtils.createMigrations({
					migrator,
					baseNames: ['someMigrationName', 'anotherMigrationName']
				});
			})
			.then((names) => {
				return Promise.all([
					testUtils.markMigrationsExecuted({migrator, names}),
					testUtils.setMigrationTags({
						migrator,
						name: names[0],
						tags: ['someTag']
					})
				]);
			});
	});

	after(() => testUtils.destroyMigrator({migrator}));

	it('should be done without error', () => {
		const cwd = testUtils.getTestDirPath();

		return Promise.resolve()
			.then(() => {
				return testUtils.execAsync(
					`"${binPath}" rollback --tag someTag`,
					{cwd}
				);
			})
			.then((result) => {
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
