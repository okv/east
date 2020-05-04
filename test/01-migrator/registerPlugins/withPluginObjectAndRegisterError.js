const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

const describeTitle = (
	'migrator configure register plugins with plugin object and register error'
);

describe(describeTitle, () => {
	let migratorMock;
	let plugin;

	before(() => {
		migratorMock = new Migrator();

		migratorMock._createAdapter = () => testUtils.createAdapter();

		migratorMock._tryLoadModule = () => {
			throw new Error('Some error');
		};

		plugin = testUtils.createPlugin({
			register: () => {
				throw new Error('Some register error');
			}
		});
	});

	it('should throw an error', () => {
		return Promise.resolve()
			.then(() => {
				return migratorMock.configure({plugins: [plugin]});
			})
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).equal(
					'Error register plugin: Some register error'
				);
			});
	});
});
