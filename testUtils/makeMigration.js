const _ = require('underscore');

module.exports = (params) => {
	const migration = {};
	migration.name = '9999_test';

	migration.migrate = (client, done) => {
		done();
	};
	migration.rollback = (client, done) => {
		done();
	};

	return _(migration).extend(params);
};
