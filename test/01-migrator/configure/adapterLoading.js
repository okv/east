'use strict';

const _ = require('underscore');
const tap = require('tap');
const expect = require('expect.js');
const Migrator = require('../../../lib/migrator');
const testUtils = require('../../../testUtils');

tap.mochaGlobals();

describe('migrator configure adapter loading', () => {
	let Adapter;

	before(() => {
		Adapter = function AdapterMock() {
		};

		Adapter.prototype = testUtils.createAdapter({withCallbacMethods: true});
	});

	it('should try migrator-related path first then CWD-related', () => {
		const paths = [];

		return Promise.resolve()
			.then(() => {
				const migrator = new Migrator();

				migrator._tryLoadModule = (path) => {
					paths.push(path);

					return paths.length === 2 ? Adapter : new Error('Whatever.');
				};

				return migrator.configure({adapter: 'X', loadConfig: false});
			})
			.then(() => {
				expect(paths[0]).eql('X');
				expect(paths[1].substr(-2, 2)).eql('/X');
			});
	});

	it('should throw an error when both paths can not be resolved', () => {
		return Promise.resolve()
			.then(() => {
				const migrator = new Migrator();

				migrator._tryLoadModule = () => {
					throw new Error('Whatever.');
				};

				return migrator.configure({adapter: 'X', loadConfig: false});
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
		const migrator = new Migrator();
		migrator._tryLoadModule = () => Adapter;
		const adapterMethodNames = [
			'connect',
			'disconnect',
			'getExecutedMigrationNames',
			'markExecuted',
			'unmarkExecuted'
		];


		return Promise.resolve()
			.then(() => migrator.configure({loadConfig: false}))
			.then(() => {
				_(adapterMethodNames).each((adapterMethodName) => {
					const result = migrator.adapter[adapterMethodName]();

					expect(result).a(Promise);
				});
			});
	});
});
