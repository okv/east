'use strict';

const exec = require('child_process').exec;
const pify = require('pify');

const execAsync = pify(exec, {multiArgs: true});

module.exports = (cmd) => {
	return Promise.resolve()
		.then(() => execAsync(cmd))
		.then((results) => {
			return {stdout: results[0], stderr: results[1]};
		});
};
