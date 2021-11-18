const tap = require('tap');
const expect = require('expect.js');
const fs = require('fs');
const pathUtils = require('path');
const testUtils = require('../../../../../../testUtils');

tap.mochaGlobals();

// skip this test if es modules are not supported
if (!testUtils.isEsmSupported()) {
	tap.grepInvert = 1;
	tap.grep = [/.*/];
}

const describeTitle = 'bin/east init with es module config';

describe(describeTitle, () => {
	let commandResult;
	let testEnv;
	let configPath;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createEnv())
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
			});
	});

	before(() => {
		return Promise.resolve()
			.then(() => {
				configPath = pathUtils.join(testEnv.dir, 'eastrc.mjs');
				return fs.promises.writeFile(
					configPath,
					'export default {timeout: 123456789};',
					'utf-8'
				);
			});
	});

	after(() => fs.promises.unlink(configPath));

	after(() => testUtils.destroyEnv(testEnv));

	it('should be done without error', () => {
		return Promise.resolve()
			.then(() => {
				const binPath = testUtils.getBinPath('east');

				return testUtils.execAsync(
					`"${binPath}" init --config "${configPath}" --trace --es-modules`,
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
