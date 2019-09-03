'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const binPath = testUtils.getBinPath('east');
const describeTitle = 'bin/east list without params';

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
			});
	});

	after(() => testUtils.destroyMigrator({migrator}));

	it('should be done without error', () => {
		const cwd = testUtils.getTestDirPath();

		return Promise.resolve()
			.then(() => {
				return testUtils.execAsync(
					`"${binPath}" list`,
					{cwd}
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
