const _ = require('underscore');

module.exports = ({path, esModules}) => Promise.resolve()
	.then(() =>
		esModules ? import(path) : require(path)
	)
	.then((loadedModule) => {
		loadedModule = loadedModule.default || loadedModule;
		loadedModule = _.isObject(loadedModule) && !_.isFunction(loadedModule) ?
			_({}).extend(loadedModule) :
			loadedModule;

		return loadedModule;
	});
