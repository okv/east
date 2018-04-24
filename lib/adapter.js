'use strict';

const pathUtils = require('path');
const fse = require('fs-extra');
const pProps = require('p-props');

/**
 * Fs adapter stores executed migration in file system.
 * NOTICE: because of entry file is read and write and it's async operations
 * parallel execution of write operations (`markExecuted` or `unmarkExecuted`)
 * could break executed migrations list.
 */
function Adapter(params) {
	this.params = params || {};

	if (!this.params.dir) {
		throw new Error('`dir` parameter required');
	}

	this.migrationsFilePath = (
		this.params.migrationsFile ||
		pathUtils.join(this.params.dir, '.migrations')
	);

	this.dir = __dirname;
}

Adapter.prototype.getTemplatePath = function getTemplatePath() {
	return pathUtils.join(this.dir, 'migrationTemplate.js');
};

/**
 * Method connects to databse and returns single object which will be passed to
 * migrate rollback functions
 */
Adapter.prototype.connect = function connect() {
	return Promise.resolve();
};

Adapter.prototype.disconnect = function disconnect() {
	return Promise.resolve();
};

Adapter.prototype.getExecutedMigrationNames =
	function getExecutedMigrationNames() {
		return Promise.resolve()
			.then(() => fse.pathExists(this.migrationsFilePath))
			.then((exists) => {
				if (exists) {
					return fse.readJson(this.migrationsFilePath);
				} else {
					return [];
				}
			})
			.then((names) => {
				const promisesHash = {names};

				if (names.length === 0) {
					promisesHash.writeResult = this._writeMigrationNames(names);
				}

				return pProps(promisesHash);
			})
			.then((result) => result.names);
	};

Adapter.prototype.markExecuted = function markExecuted(name) {
	return Promise.resolve()
		.then(() => this.getExecutedMigrationNames())
		.then((names) => {
			if (names.indexOf(name) === -1) {
				const newNames = [].concat(names);
				newNames.push(name);

				return this._writeMigrationNames(newNames);
			}
		});
};

Adapter.prototype.unmarkExecuted = function unmarkExecuted(name) {
	return Promise.resolve()
		.then(() => this.getExecutedMigrationNames())
		.then((names) => {
			const index = names.indexOf(name);
			if (index !== -1) {
				const newNames = [].concat(names);
				newNames.splice(index, 1);

				return this._writeMigrationNames(newNames);
			}
		});
};

Adapter.prototype._writeMigrationNames = function _writeMigrationNames(names) {
	return fse.writeJson(
		this.migrationsFilePath, names, {spaces: 4}
	);
};

module.exports = Adapter;
