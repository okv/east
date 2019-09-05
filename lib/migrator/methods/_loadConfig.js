'use strict';

const _ = require('underscore');
const pathUtils = require('path');
const fse = require('fs-extra');
const pify = require('pify');

module.exports = function _loadConfig(configPath) {
	const defaultConfigPath = pathUtils.resolve('.eastrc');

	return Promise.resolve()
		.then(() => {
			if (!configPath) {
				return fse.pathExists(defaultConfigPath);
			}
		})
		.then((defaultConfigPathExists) => {
			if (configPath) {
				return pathUtils.resolve(configPath);
			} else {
				return defaultConfigPathExists ? defaultConfigPath : '';
			}
		})
		.then((path) => {
			if (path) {
				return fse.readJson(path).catch((readErr) => {
					try {
						// eslint-disable-next-line import/no-dynamic-require
						return require(path);
					} catch (requireErr) {
						throw new Error(
							`Error while loading config "${path}" as json:\n` +
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
					return pify(config)();
				} else {
					return Promise.resolve(config());
				}
			} else {
				return config;
			}
		});
};
