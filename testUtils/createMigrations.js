const pMap = require('p-map');

module.exports = (params) => {
	const migrator = params.migrator;
	const baseNames = params.baseNames;

	return pMap(baseNames, (baseName) => {
		return migrator.create(baseName);
	}, {concurrency: 1});
};
