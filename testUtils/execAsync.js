'use strict';

const exec = require('child_process').exec;
const pify = require('pify');

const execAsync = pify(exec, {multiArgs: true});

module.exports = (cmd, options) => {
	return Promise.resolve()
		.then(() => execAsync(cmd, options))
		.then((results) => {
			return {stdout: results[0], stderr: results[1]};
		})
		.catch((results) => {
			const err = results[0];
			const stdout = results[1];
			const stderr = results[2];

			err.stdout = stdout;
			err.stderr = stderr;

			throw err;
		});
};
