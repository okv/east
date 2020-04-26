'use strict';

const pathUtils = require('path');
const _ = require('underscore');
const fs = require('fs');

// allow to enable config loading by env var, useful for integration
// testing with different adapters
const loadConfig = Boolean(Number(process.env.NODE_EAST_TEST_LOAD_CONFIG));

module.exports = (params) => {
	const dir = params.dir;
	const migrator = params.migrator;

	let configParams;

	if (migrator) {
		configParams = {
			dir: migrator.params.dir,
			sourceDir: migrator.params.sourceDir
		};
	} else {
		configParams = params.configParams;
	}

	const configPath = pathUtils.join(dir, '.eastrc');

	return Promise.resolve()
		.then(() => {
			if (loadConfig) {
				const cwdConfigPath = pathUtils.resolve('.eastrc');

				return fs.promises.readFile(cwdConfigPath, 'utf-8');
			}
		})
		.then((cwdConfigParamsText) => {
			let cwdConfigParams;
			if (cwdConfigParamsText) {
				cwdConfigParams = JSON.parse(cwdConfigParamsText);
			} else {
				cwdConfigParams = {};
			}
			return fs.promises.writeFile(
				configPath,
				JSON.stringify(_(configParams).defaults(cwdConfigParams)),
				'utf-8'
			);
		})
		.then(() => configPath);
};
