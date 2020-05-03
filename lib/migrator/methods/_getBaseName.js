// get basename from name
module.exports = function _getBaseName(name) {
	return this._nameRegExp.exec(name)[2];
};
