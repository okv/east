const fs = require('fs');
const pProps = require('p-props');

module.exports = function create(baseName) {
	return Promise.resolve()
		.then(() => {
			return this._getNextNumber();
		})
		.then((num) => {
			const name = `${num}_${baseName}`;
			const path = this.getMigrationPathByName(name, 'source');

			return pProps({
				name,
				copyResult: fs.promises.copyFile(this.params.template, path)
			});
		})
		.then((result) => result.name);
};
