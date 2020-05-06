const pathExists = require('path-exists');

module.exports = function isDirExists(migrationType = 'executable') {
	return Promise.resolve()
		.then(() => {
			const {dir} = this._getMigrationFileTypeParams(migrationType);
			return pathExists(dir);
		});
};
