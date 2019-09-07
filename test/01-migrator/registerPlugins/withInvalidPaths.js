'use strict';

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

		migratorMock._tryLoadModule = () => {
			throw new Error('Some error');
		};
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
				expect(err.message).equal('Some error');
			});
	});
});
