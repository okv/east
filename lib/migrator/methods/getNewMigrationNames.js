const _ = require('underscore');
const pProps = require('p-props');

module.exports = function getNewMigrationNames() {
	return Promise.resolve()
		.then(() => {
			return pProps({
				allNames: this.getAllMigrationNames(),
				executedNames: this.adapter.getExecutedMigrationNames()
			});
		})
		.then((result) => {
			const executedNamesHash = _(result.executedNames).indexBy();

			const newNames = result.allNames.filter((name) => {
				return !_(executedNamesHash).has(name);
			});

			return newNames;
		});
};
