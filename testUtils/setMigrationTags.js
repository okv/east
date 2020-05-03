const fs = require('fs');

module.exports = (params) => {
	const migrator = params.migrator;
	const name = params.name;
	const tags = params.tags;

	return Promise.resolve()
		.then(() => {
			const path = migrator.getMigrationPathByName(name);

			return fs.promises.writeFile(
				path,
				`\nexports.tags = ${JSON.stringify(tags)};\n`,
				{flag: 'a', encoding: 'utf-8'}
			);
		})
		.then(() => null);
};
