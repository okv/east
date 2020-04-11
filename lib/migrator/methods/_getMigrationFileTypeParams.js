'use strict';

module.exports =
	function _getMigrationFileTypeParams(migrationFileType) {
		if (migrationFileType === 'executable') {
			return {
				dir: this.params.dir,
				extension: this.params.migrationExtension
			};
		}
		if (migrationFileType === 'source') {
			return {
				dir: this.params.sourceDir,
				extension: this.params.sourceMigrationExtension
			};
		}
		throw new Error(
			"Invalid migration file type, expected 'executable' or 'source' " +
			`but got '${migrationFileType}'`
		);
	};
