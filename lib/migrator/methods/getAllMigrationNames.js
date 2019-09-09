'use strict';

const fse = require('fs-extra');

module.exports = function getAllMigrationNames() {
	return Promise.resolve()
		.then(() => {
			return fse.readdir(this.params.dir);
		})
		.then((paths) => {
			const names = paths
				.filter((fileName) => {
					return this._fileNameRegExp.test(fileName);
				})
				.sort((fileNameOne, fileNameTwo) => {
					return (
						this._getNumber(fileNameOne) - this._getNumber(fileNameTwo)
					);
				})
				.map(this.getMigrationNameByPath);

			return names;
		});
};
