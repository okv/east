const pathUtils = require('path');

module.exports = function getMigrationNameByPath(
	path,
	migrationFileType = 'executable'
) {
	const {extension} = this._getMigrationFileTypeParams(migrationFileType);
	return pathUtils.basename(path, `.${extension}`);
};
