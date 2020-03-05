'use strict';

const fse = require('fs-extra');
const pProps = require('p-props');
const pathUtils = require('path');

module.exports = function create(baseName) {
	return Promise.resolve()
		.then(() => {
			return this._getNextNumber();
		})
		.then((num) => {
		const name = `${num}_${baseName}`;
      		const extName = pathUtils.extname(this.params.template);
     			const path = replaceExt(this.getMigrationPathByName(name), extName);

			return pProps({
				name,
				copyResult: fse.copy(this.params.template, path)
			});
		})
		.then((result) => result.name);
};

function replaceExt(path, ext) {
  const fileName = pathUtils.basename(path, pathUtils.extname(path)) + ext;
  return pathUtils.join(pathUtils.dirname(path), fileName);
}
