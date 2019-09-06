'use strict';

const pathUtils = require('path');
const fse = require('fs-extra');


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
		.then(() => fse.writeJSON(configPath, configParams))
		.then(() => configPath);
};
