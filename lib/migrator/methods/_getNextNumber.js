module.exports = function _getNextNumber() {
	if (this.params.migrationNumberFormat === 'dateTime') {
		return this._getDateTimeNumber();
	} else if (this.params.migrationNumberFormat === 'sequentialNumber') {
		return this._getSequentialNumber();
	} else {
		throw new Error(
			`Unrecognised number format: "${this.params.migrationNumberFormat}". ` +
			'Supported values are "dateTime" and "sequentialNumber".'
		);
	}
};
