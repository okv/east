const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

const describeTitle = (
	'migrator configure register plugins with invalid paths'
);

describe(describeTitle, () => {
	let migratorMock;

	before(() => {
		migratorMock = new Migrator();

		migratorMock._createAdapter = () => testUtils.createAdapter();

		migratorMock._loadModule = (path) => Promise.reject(
			new Error(`Can't load path ${path}`)
		);
	});

	it('should throw an error', () => {
		return Promise.resolve()
			.then(() => {
				return migratorMock.configure({plugins: ['somePlugin']});
			})
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).match(
					/Error during plugin registration: Can't load path/
				);
			});
	});
});
