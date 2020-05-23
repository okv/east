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
				const normalizedName = pathUtils.basename(name, '.js');

				// check by full name
				if (_(namesHash).has(normalizedName)) return normalizedName;

				// check by number
				const numberParts = /^[0-9]+$/.exec(normalizedName);
				const number = numberParts ? numberParts[0] : null;

				if (number) {
					if (_(numbersHash).has(number)) {
						if (numbersHash[normalizedName].length === 1) {
							return numbersHash[number][0];
						} else {
							throw new Error(
								`Specified migration name "${normalizedName}" is ambiguous: ` +
								`${numbersHash[number].join(', ')} please choose one`
							);
						}
					}
				} else {
				// check by base name
					const baseName = normalizedName;

					if (_(baseNamesHash).has(baseName)) {
						if (baseNamesHash[normalizedName].length === 1) {
							return baseNamesHash[baseName][0];
						} else {
							throw new Error(
								`Specified migration name "${normalizedName}" is ambiguous: ` +
								`${baseNamesHash[baseName].join(', ')} please choose one`
							);
						}
					}
				}

				return normalizedName;
			});

			return normalizedNames;
		});
};
