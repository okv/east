const utils = require('../../utils');

module.exports = function _tryLoadModule(path) {
	return utils.loadModule({path, esModules: this.params.esModules});
};
