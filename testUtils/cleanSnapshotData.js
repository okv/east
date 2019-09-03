'use strict';

const migrationsDirRegExp = new RegExp(
	'/.+/migrations',
	'g'
);
const eastStackTraceRegExp = new RegExp(
	'^.*at.*\\(.*/east/.*(([\\r\\n])+ {4}at <anonymous>)?',
	'gm'
);

module.exports = (data) => {
	return (
		data.replace(migrationsDirRegExp, '[Migrations dir]')
			.replace(eastStackTraceRegExp, '[East source stack trace]')
	);
};
