const pMap = require('p-map');

// check that all migrations exists
module.exports = function checkMigrationsExists(names) {
	return Promise.resolve()
		.then(() => {
			return pMap(names, (name) => {
				return this.isMigrationExists(name);
			}, {concurrency: 10});
		})
		.then((existGroupResults) => {
			existGroupResults.forEach((migrationExists, index) => {
				if (!migrationExists) {
					const name = names[index];

					throw new Error(`Migration "${name}" doesn't exist`);
				}
			});
		});
};
