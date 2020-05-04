module.exports = function _getMigrationFileTypeParams(migrationFileType) {
	if (migrationFileType === 'executable') {
		const {dir, migrationExtension: extension} = this.params;
		return {dir, extension};
	} else if (migrationFileType === 'source') {
		const {sourceDir: dir, sourceMigrationExtension: extension} = this.params;
		return {dir, extension};
	} else {
		throw new Error(
			'Invalid migration file type, expected "executable" or "source" ' +
			`but got "${migrationFileType}"`
		);
	}
};
