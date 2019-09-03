'use strict';

const migrationsDirRegExp = new RegExp(
	'/.+/migrations',
	'g'
);
const migrationFileRegExp = new RegExp(
	'/.+/migrations/.+',
	'g'
);
const eastStackTraceRegExp = new RegExp(
	'^.*/.+/east/.+.js.*',
	'gm'
);

module.exports = (data) => {
	return (
		data.replace(migrationsDirRegExp, '[Migrations dir]')
			.replace(migrationFileRegExp, '[Migration file]')
			.replace(eastStackTraceRegExp, '[East source stack trace]')
	);
};
