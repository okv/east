const pathUtils = require('path');

module.exports = function _resolveModulePath(path) {
	// don't do anything with absolute path
	if (pathUtils.isAbsolute(path)) {
		return path;
	// resolve related path (has path separator and is not scoped package)
	// according to cwd
	} else if (
		path.includes(pathUtils.sep) &&
		path.indexOf('@') !== 0
	) {
		return pathUtils.resolve(path);
	// otherwise treat path like module name - return "as is"
	} else {
		return path;
	}
};
