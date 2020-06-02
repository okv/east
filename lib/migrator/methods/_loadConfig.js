const _ = require('underscore');
const pathUtils = require('path');
const fs = require('fs');
const {promisify} = require('util');
const pathExists = require('path-exists');
const {loadModule} = require('../../utils');

module.exports = function _loadConfig({path, defaultPath = '.eastrc'}) {
	const resolvedDefaultPath = defaultPath && pathUtils.resolve(defaultPath);

	return Promise.resolve()
		.then(() => {
			if (!path) {
				return resolvedDefaultPath && pathExists(resolvedDefaultPath);
			}
		})
		.then((defaultPathExists) => {
			if (path) {
				return pathUtils.resolve(path);
			} else {
				return defaultPathExists ? resolvedDefaultPath : '';
			}
		})
		.then((resolvedPath) => {
			if (resolvedPath) {
				return fs.promises.readFile(resolvedPath, 'utf-8')
					.then((configText) => JSON.parse(configText))
					.catch((readErr) => {
						try {
							return loadModule({
								path: resolvedPath,
								esModules: this.params.esModules
							});
						} catch (requireErr) {
							throw new Error(
								`Error while loading config "${resolvedPath}" as json:\n` +
								`${readErr.stack || readErr}\n\nand as script:\n` +
								`${requireErr.stack || requireErr}\n`
							);
						}
					});
			} else {
				return {};
			}
		})
		.then((config) => {
			if (_(config).isFunction()) {
				if (config.length === 1) {
					return promisify(config)();
				} else {
					return Promise.resolve(config());
				}
			} else {
				return config;
			}
		});
};
