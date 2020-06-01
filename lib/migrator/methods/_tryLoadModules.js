const pMap = require('p-map');

module.exports = function _tryLoadModules(paths) {
	return new Promise((resolve) => {
		let loadedModule;
		const errors = [];

		return pMap(paths, (path) => {
			if (loadedModule) return;

			return this._tryLoadModule(path)
				.then((resultModule) => {
					loadedModule = resultModule;

					resolve({loadedModule, errors});
				})
				.catch((err) => {
					errors.push(err);

					if (errors.length === paths.length) {
						resolve({loadedModule, errors});
					}
				});
		}, {concurrency: 1});
	});
};
