'use strict';

const pathUtils = require('path');

module.exports =
	function getMigrationPathByName(name, migrationFileType = 'executable') {
		const {dir, extension} = this._getMigrationTypeParams(migrationFileType);

		return pathUtils.resolve(pathUtils.join(dir, `${name}.${extension}`));
	};
