'use strict';

const tap = require('tap');
const expect = require('expect.js');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

describe('migrator configure adapter loading', () => {
	const mockAdapter = function mockAdapter() {
		this.getTemplatePath = () => {};
	};

	it('should try migrator-related path first then CWD-related', () => {
		const paths = [];

		return Promise.resolve()
			.then(() => {
				const migratorMock = new Migrator();

				migratorMock._tryLoadAdapter = (path) => {
					paths.push(path);

					return paths.length === 2 ? mockAdapter : new Error('Whatever.');
				};

				return migratorMock.configure({adapter: 'X'});
			})
			.then(() => {
				expect(paths[0]).eql('X');
				expect(paths[1].substr(-2, 2)).eql('/X');
			});
	});

	it('should throw an error when both paths can not be resolved', () => {
		return Promise.resolve()
			.then(() => {
				const migratorMock = new Migrator();

				migratorMock._tryLoadAdapter = () => {
					throw new Error('Whatever.');
				};

				return migratorMock.configure({adapter: 'X'});
			})
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).equal('Whatever.');
			});
	});
});
