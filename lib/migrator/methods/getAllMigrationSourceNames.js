'use strict';

const fse = require('fs-extra');

module.exports = function getAllMigrationSourceNames() {
	return Promise.resolve()
		.then(() => {
			return fse.readdir(this.params.sourceDir);
		})
		.then((paths) => {
			const names = paths
				.filter((fileName) => {
					const {sourceMigrationExtension} = this.params;

					return fileName.endsWith(`.${sourceMigrationExtension}`) &&
						this._nameRegExp.test(fileName.slice(
							0, -(sourceMigrationExtension.length + 1)
						));
				})
				.sort((fileNameOne, fileNameTwo) => {
					return (
						this._getNumber(fileNameOne) - this._getNumber(fileNameTwo)
					);
				})
				.map((path) => this.getMigrationSourceNameByPath(path));

			return names;
		});
};
