'use strict';

const migrationsDirRegExp = new RegExp(
	'`/.+/migrations`'
);
const migrationFileRegExp = new RegExp(
	'/.+/migrations/.+',
	'g'
);

module.exports = (data) => {
	return (
		data.replace(migrationsDirRegExp, '[Migrations dir]')
			.replace(migrationFileRegExp, '[Migration file]')
	);
};
