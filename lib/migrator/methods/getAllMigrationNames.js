'use strict';

const fse = require('fs-extra');
const pathUtils = require('path');

module.exports =
	function getAllMigrationNames(migrationFileType = 'executable') {
		return Promise.resolve()
			.then(() => {
				const {dir} = this._getMigrationTypeParams(migrationFileType);

				return fse.readdir(dir);
			})
			.then((paths) => {
				const {extension} = this._getMigrationTypeParams(migrationFileType);
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
