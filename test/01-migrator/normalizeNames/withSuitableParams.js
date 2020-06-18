const pathUtils = require('path');
const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator normalizeNames with suitable params', () => {
	let migrator;
	let testEnv;

	before(() => {
		return Promise.resolve()
			.then(() => {
				return testUtils.createEnv({
					migratorParams: {init: true, connect: true}
				});
			})
			.then((createdTestEnv) => {
				testEnv = createdTestEnv;
				migrator = testEnv.migrator;
			});
	});

	const baseNames = ['first', 'second', 'third', 'second'];
	let names = [];

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrations({migrator, baseNames}))
			.then((migrationNames) => {
				names = migrationNames;
			});
	});

	after(() => testUtils.removeMigrations({migrator, names}));

	after(() => testUtils.destroyEnv(testEnv));

	const nomrmalizeAndCheckName = (inputName, expectedName) => {
		return Promise.resolve()
			.then(() => migrator.normalizeNames([inputName]))
			.then((normalizedNames) => {
				expect(normalizedNames[0]).equal(expectedName);
			});
	};

	it('by path should be ok', () => {
		const name = names[0];
		const path = pathUtils.join('migrations', name);

		return nomrmalizeAndCheckName(path, name);
	});

	it('by full name should be ok', () => {
		const name = names[0];

		return nomrmalizeAndCheckName(name, name);
	});

	it('by number should be ok', () => {
		const number = '1';
		const name = names[0];

		return nomrmalizeAndCheckName(number, name);
	});

	it('by basename should be ok', () => {
		const baseName = baseNames[0];
		const name = names[0];

		return nomrmalizeAndCheckName(baseName, name);
	});

	it('by ambiguous basename should return an error', () => {
		const baseName = baseNames[1];

		return Promise.resolve()
			.then(() => migrator.normalizeNames([baseName]))
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).contain(
					`Specified migration name "${baseName}" is ambiguous`
				);
			});
	});
});
