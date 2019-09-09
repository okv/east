'use strict';

module.exports = function disconnect() {
	return this.adapter.disconnect();
};
