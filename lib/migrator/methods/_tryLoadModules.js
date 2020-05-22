const _ = require('underscore');

module.exports = function _tryLoadModules(paths) {
	return new Promise((resolve) => {
		const results = [];

		const collectResults = (result) => {
			results.push(result);

			if (results.length === paths.length) {
				resolve({
					loadedModule: _(results).find((item) => !_.isError(item)),
					errors: _(results).filter(_.isError)
				});
			}
		};

		for (let i = 0; i < paths.length; i++) {
			this._tryLoadModule(paths[i])
				.then(collectResults)
				.catch(collectResults);
		}
	});
};
