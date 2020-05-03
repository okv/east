module.exports = function getMigrationNames(status) {
	return Promise.resolve()
		.then(() => {
			if (status === 'all') {
				return this.getAllMigrationNames();
			} else if (status === 'executed') {
				return this.adapter.getExecutedMigrationNames();
			} else if (status === 'new') {
				return this.getNewMigrationNames();
			} else {
				throw new Error(`Unrecognized status "${status}"`);
			}
		});
};
