const _ = require('underscore');
const pathUtils = require('path');
const fs = require('fs');
const pProps = require('p-props');
const pathExists = require('path-exists');

/**
 * Fs adapter stores executed migration in file system.
 * NOTICE: because of entry file is read and write and it's async operations
 * parallel execution of write operations (`markExecuted` or `unmarkExecuted`)
 * could break executed migrations list.
 */
function Adapter(params) {
	this.params = params || {};

	if (!this.params.dir) {
		throw new Error('"dir" parameter is required');
	}

	this.migrationsFilePath = (
		this.params.migrationsFile ||
		pathUtils.join(this.params.dir, '.migrations')
	);

	this.dir = __dirname;
}

Adapter.prototype.getTemplatePath = function getTemplatePath(fileExtension) {
	if (!['js', 'mjs', 'ts'].includes(fileExtension)) {
		throw new Error(
			`Adapter doesn't provide template ".${fileExtension}" source files`
		);
	}

	return pathUtils.join(this.dir, `migrationTemplate.${fileExtension}`);
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
			.then(() => pathExists(this.migrationsFilePath))
			.then((exists) => {
				if (exists) {
					return fs.promises.readFile(
						this.migrationsFilePath,
						'utf-8'
					);
				} else {
					return '[]';
				}
			})
			.then((namesText) => {
				const names = JSON.parse(namesText);
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
			if (!_(names).contains(name)) {
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
			if (_(names).contains(name)) {
				const newNames = [].concat(names);
				newNames.splice(index, 1);

				return this._writeMigrationNames(newNames);
			}
		});
};

Adapter.prototype._writeMigrationNames = function _writeMigrationNames(names) {
	return fs.promises.writeFile(
		this.migrationsFilePath,
		JSON.stringify(names, null, 4),
		'utf-8'
	);
};

module.exports = Adapter;
