module.exports = function filterMigrationNames(params) {
	return Promise.resolve()
		.then(() => {
			if (params.by === 'tag') {
				return this._filterMigrationNamesByTag(params);
			} else {
				throw new Error(`Don't know how to filter by "${params.by}"`);
			}
		});
};
