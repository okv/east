// get number from name
module.exports = function _getNumber(name) {
	const numParts = this._nameRegExp.exec(name);
	return numParts ? Number(numParts[1]) : 0;
};
