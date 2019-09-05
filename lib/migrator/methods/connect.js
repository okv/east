'use strict';

const ProgressBar = require('progress');

module.exports = function connect() {
	return Promise.resolve()
		.then(() => {
			return this.adapter.connect();
		})
		.then((params) => {
			this._migrationParams = params || {};

			// add helpers
			this._migrationParams.createBar = (total) => {
				const bar = new ProgressBar(
					'[:bar] :current / :total',
					{total, width: 30, incomplete: ' '}
				);
				return bar;
			};
		});
};
