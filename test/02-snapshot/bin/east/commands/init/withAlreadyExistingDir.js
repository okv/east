'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

const binPath = testUtils.getBinPath('east');
const describeTitle = 'bin/east init command with already existing dir';

describe(describeTitle, () => {
	let commandErr;
	let migrator;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrator({init: true}))
			.then((createdMigrator) => {
				migrator = createdMigrator;
			});
	});

	after(() => testUtils.destroyMigrator({migrator}));

	it('should be done with error', () => {
		const cwd = testUtils.getTestDirPath();

		return Promise.resolve()
			.then(() => {
				return testUtils.execAsync(
					`"${binPath}" init`,
					{cwd}
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
				expect(err.stdout).not.ok();

				commandErr = err;
			});
	});

	it('stderr should match expected snapshot', () => {
		tap.matchSnapshot(
			testUtils.cleanSnapshotData(commandErr.stderr),
			'output'
		);
	});
});
