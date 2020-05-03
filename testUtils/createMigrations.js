const pMap = require('p-map');

module.exports = ({migrator, baseNames}) => {
	return pMap(baseNames, (baseName) => {
		return migrator.create(baseName);
	}, {concurrency: 1});
};
