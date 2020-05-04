const fs = require('fs');
const pathUtils = require('path');

module.exports = function getAllMigrationNames(
	migrationFileType = 'executable'
) {
	return Promise.resolve()
		.then(() => {
			const {dir} = this._getMigrationFileTypeParams(migrationFileType);

			return fs.promises.readdir(dir);
		})
		.then((paths) => {
			const {extension} = this._getMigrationFileTypeParams(migrationFileType);
			const names = paths
				.filter((path) => {
					const file = pathUtils.parse(path);

					return file.ext === `.${extension}` && this._nameRegExp.test(file.name);
				})
				.sort((fileNameOne, fileNameTwo) => {
					return (
						this._getNumber(fileNameOne) - this._getNumber(fileNameTwo)
					);
				})
				.map((path) => this.getMigrationNameByPath(path, migrationFileType));

			return names;
		});
};
