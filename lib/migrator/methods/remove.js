'use strict';

const fse = require('fs-extra');

module.exports = function remove(name) {
	return Promise.resolve()
		.then(() => {
			return Promise.all([
				this.isMigrationExists(name),
				this.isMigrationExists(name, 'source')
			]);
		})
		.then(([executableExists, sourceExists]) => {
			const filesToDelete = new Set();

			if (executableExists) {
				filesToDelete.add(this.getMigrationPathByName(name));
			}
			if (sourceExists) {
				filesToDelete.add(this.getMigrationPathByName(name, 'source'));
			}
			return Promise.all(
				[...filesToDelete.values()].map((path) => fse.unlink(path))
			);
		});
};
