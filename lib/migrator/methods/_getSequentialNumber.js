module.exports = function _getSequentialNumber() {
	return Promise.resolve()
		.then(() => {
			return this.getAllMigrationNames();
		})
		.then((allNames) => {
			const lastNames = allNames[allNames.length - 1];
			const num = this._getNumber(lastNames) + 1;

			return num;
		});
};
