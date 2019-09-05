'use strict';

const _ = require('underscore');
const pathUtils = require('path');

// convert paths, full names, basenames or numbers to full names
module.exports = function normalizeNames(names) {
	return Promise.resolve()
		.then(() => {
			return this.getAllMigrationNames();
		})
		.then((allNames) => {
			const numbersHash = {};
			const baseNamesHash = {};
			const namesHash = {};

			// build hashes
			allNames.forEach((name) => {
				namesHash[name] = name;

				const number = this._getNumber(name);
				if (!numbersHash[number]) {
					numbersHash[number] = [];
				}
				numbersHash[number].push(name);

				const baseName = this._getBaseName(name);
				if (!baseNamesHash[baseName]) {
					baseNamesHash[baseName] = [];
				}
				baseNamesHash[baseName].push(name);
			});

			const normalizedNames = names.map((name) => {
				name = pathUtils.basename(name, '.js');

				// check by full name (or path, coz `basename` removes dir)
				if (_(namesHash).has(name)) return name;

				// check by number
				const numberParts = /^[0-9]+$/.exec(name);
				const number = numberParts ? numberParts[0] : null;

				if (number) {
					if (_(numbersHash).has(number)) {
						if (numbersHash[name].length === 1) {
							return numbersHash[number][0];
						} else {
							throw new Error(
								`Specified migration name "${name}" is ambiguous: ` +
								`${numbersHash[number].join(', ')} please choose one`
							);
						}
					}
				} else {
				// check by base name
					const baseName = name;

					if (_(baseNamesHash).has(baseName)) {
						if (baseNamesHash[name].length === 1) {
							return baseNamesHash[baseName][0];
						} else {
							throw new Error(
								`Specified migration name "${name}" is ambiguous: ` +
								`${baseNamesHash[baseName].join(', ')} please choose one`
							);
						}
					}
				}

				return name;
			});

			return normalizedNames;
		});
};
