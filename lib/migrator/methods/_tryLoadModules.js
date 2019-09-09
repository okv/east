'use strict';

module.exports = function _tryLoadModules(paths) {
	let loadedModule;
	const errors = [];

	for (let i = 0; i < paths.length; i++) {
		loadedModule = this._tryLoadModule(paths[i]);

		if (loadedModule instanceof Error) {
			errors.push(loadedModule);
		} else {
			break;
		}
	}

	return {loadedModule, errors};
};
