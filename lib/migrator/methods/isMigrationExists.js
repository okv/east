const pathExists = require('path-exists');

module.exports = function isMigrationExists(
	name,
	migrationFileType = 'executable'
) {
	return Promise.resolve()
		.then(() => {
			const path = this.getMigrationPathByName(name, migrationFileType);
			return pathExists(path);
		});
};
