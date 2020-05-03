const pMap = require('p-map');

module.exports = (params) => {
	const migrator = params.migrator;
	const names = params.names;

	return pMap(
		names,
		(name) => migrator.adapter.markExecuted(name),
		{concurrency: 1}
	);
};
