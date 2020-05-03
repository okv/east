module.exports = function connect() {
	return Promise.resolve()
		.then(() => this.adapter.connect())
		.then((params) => {
			this._migrationParams = params || {};
		});
};
