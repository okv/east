const fs = require('fs');

module.exports = function init() {
	return Promise.resolve()
		.then(() => {
			return Promise.all([
				this.isDirExists('executable'),
				this.isDirExists('source')
			]);
		})
		.then(([dirExists, sourceDirExists]) => {
			const {dir, sourceDir} = this.params;

			if (dirExists && sourceDirExists) {
				if (sourceDir === dir) {
					throw new Error(`Migration directory "${dir}" already exists`);
				} else {
					throw new Error(
						`Migration executables directory "${dir}" and sources ` +
						`directory "${sourceDir}" already exist`
					);
				}
			}

			// create unexisting paths but only once (even dirs are equal)
			const pathsSet = new Set();
			if (!dirExists) pathsSet.add(dir);
			if (!sourceDirExists) pathsSet.add(sourceDir);
			const paths = Array.from(pathsSet.values());

			return Promise.all(paths.map((path) => fs.promises.mkdir(path)));
		});
};
