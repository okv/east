const fs = require('fs');

module.exports = (path) => {
	return fs.promises.access(path, fs.constants.F_OK)
		.then(() => true, () => false);
};
