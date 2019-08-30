'use strict';

const exec = require('child_process').exec;
const pify = require('pify');

const execAsync = pify(exec, {multiArgs: true});

module.exports = (cmd, options) => {
	return Promise.resolve()
		.then(() => execAsync(cmd, options))
		.then((results) => {
			return {stdout: results[0], stderr: results[1]};
		});
};
