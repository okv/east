'use strict';

const fse = require('fs-extra');

module.exports = function remove(name) {
	return Promise.resolve()
		.then(() => {
			return Promise.all([
				this.isMigrationExists(name, 'executable'),
				this.isMigrationExists(name, 'source')
			]);
		})
		.then(([executableExists, sourceExists]) => {
			const pathsSet = new Set();

			if (executableExists) {
				pathsSet.add(this.getMigrationPathByName(name, 'executable'));
			}
			if (sourceExists) {
				pathsSet.add(this.getMigrationPathByName(name, 'source'));
			}
			const paths = Array.from(pathsSet.values());

			return Promise.all(paths.map((path) => fse.unlink(path)));
		});
};
