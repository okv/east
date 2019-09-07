'use strict';

const _ = require('underscore');

module.exports = (params) => {
	const register = params.register;

	const plugin = {
		register: register || _.noop
	};

	return plugin;
};
