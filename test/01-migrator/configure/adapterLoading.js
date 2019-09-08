'use strict';

const _ = require('underscore');
const tap = require('tap');
const expect = require('expect.js');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

describe('migrator configure adapter loading', () => {
	const MockAdapter = function MockAdapter() {
		this.getTemplatePath = () => {};
	};

	MockAdapter.prototype.connect = (callback) => callback;
	MockAdapter.prototype.disconnect = (callback) => callback;
	MockAdapter.prototype.getExecutedMigrationNames = (callback) => callback;
	MockAdapter.prototype.markExecuted = (name, callback) => callback;
	MockAdapter.prototype.unmarkExecuted = (name, callback) => callback;

	it('should try migrator-related path first then CWD-related', () => {
		const paths = [];

		return Promise.resolve()
			.then(() => {
				const migratorMock = new Migrator();

				migratorMock._tryLoadAdapter = (path) => {
					paths.push(path);

					return paths.length === 2 ? MockAdapter : new Error('Whatever.');
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

	it('should promisify adapter methods', () => {
		const migratorMock = new Migrator();
		migratorMock._tryLoadAdapter = () => MockAdapter;
		const adapterMethodNames = [
			'connect',
			'disconnect',
			'getExecutedMigrationNames',
			'markExecuted',
			'unmarkExecuted'
		];


		return Promise.resolve()
			.then(() => migratorMock.configure())
			.then(() => {
				_(adapterMethodNames).each((adapterMethodName) => {
					const result = migratorMock.adapter[adapterMethodName]();

					expect(result).a(Promise);
				});
			});
	});
});
