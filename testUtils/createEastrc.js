'use strict';

const pathUtils = require('path');
const _ = require('underscore');
const fse = require('fs-extra');

// allow to enable config loading by env var, useful for integration
// testing with different adapters
const loadConfig = Boolean(Number(process.env.NODE_EAST_TEST_LOAD_CONFIG));

module.exports = (params) => {
	const dir = params.dir;
	const migrator = params.migrator;

	let configParams;

	if (migrator) {
		configParams = {dir: migrator.params.dir};
	} else {
		configParams = params.configParams;
	}

	const configPath = pathUtils.join(dir, '.eastrc');

	return Promise.resolve()
		.then(() => {
			if (loadConfig) {
				const cwdConfigPath = pathUtils.resolve('.eastrc');

				return fse.readJSON(cwdConfigPath);
			}
		})
		.then((cwdConfigParams) => {
			return fse.writeJSON(
				configPath,
				_(configParams).defaults(cwdConfigParams)
			);
		})
		.then(() => configPath);
};
