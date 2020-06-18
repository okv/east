const pMap = require('p-map');

module.exports = ({migrator, names}) => {
	return pMap(
		names,
		(name) => migrator.adapter.unmarkExecuted(name),
		{concurrency: 1}
	);
};
