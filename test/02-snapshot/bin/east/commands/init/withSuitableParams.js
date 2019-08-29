'use strict';

const tap = require('tap');
const testUtils = require('../../../../../../testUtils');
const Migrator = require('../../../../../../lib/migrator');

tap.mochaGlobals();

const binPath = testUtils.getBinPath('east');
const describeTitle = 'bin/east init command with suitable params';

describe(describeTitle, () => {
	let commandResult;

	const migrator = new Migrator();

	before(() => {
		return Promise.resolve()
			.then(() => migrator.configure())
			.then(() => {
				return testUtils.removeMigratorDir(migrator);
			});
	});

	after(() => {
		return testUtils.removeMigratorDir(migrator);
	});

	it('should be done without error', () => {
		return Promise.resolve()
			.then(() => {
				return testUtils.execAsync(
					`"${binPath}" init`
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
