'use strict';

const fse = require('fs-extra');

module.exports =
	function isMigrationExists(name, migrationFileType = 'executable') {
		return Promise.resolve()
			.then(() => {
				const path = this.getMigrationPathByName(name, migrationFileType);

				return fse.pathExists(path);
			});
	};
