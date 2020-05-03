const _ = require('underscore');

// separate passed migrations on new and executed
module.exports = function separateNames(names) {
	return Promise.resolve()
		.then(() => {
			return this.adapter.getExecutedMigrationNames();
		})
		.then((allExecutedNames) => {
			const allExecutedNamesHash = _(allExecutedNames).indexBy();
			const executedNames = [];
			const newNames = [];

			names.forEach((name) => {
				if (_(allExecutedNamesHash).has(name)) {
					executedNames.push(name);
				} else {
					newNames.push(name);
				}
			});

			return ({
				newNames,
				executedNames
			});
		});
};
