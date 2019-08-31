'use strict';

const fse = require('fs-extra');

module.exports = (params) => {
	const migrator = params.migrator;
	const name = params.name;
	const tags = params.tags;

	return Promise.resolve()
		.then(() => {
			const path = migrator.getMigrationPathByName(name);

			return fse.writeFile(
				path,
				`\nexports.tags = ${JSON.stringify(tags)};\n`,
				{flag: 'a'}
			);
		})
		.then(() => null);
};
