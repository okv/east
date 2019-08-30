'use strict';

const tap = require('tap');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const binPath = testUtils.getBinPath('east');
const describeTitle = 'bin/east init command with suitable params';

describe(describeTitle, () => {
	let commandResult;
	let migrator;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrator())
			.then((createdMigrator) => {
				migrator = createdMigrator;
			});
	});

	after(() => {
		return testUtils.destroyMigrator({migrator});
	});

	it('should be done without error', () => {
		return Promise.resolve()
			.then(() => {
				return testUtils.execAsync(
					`"${binPath}" init`,
					{cwd: testUtils.getTestDirPath()}
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
