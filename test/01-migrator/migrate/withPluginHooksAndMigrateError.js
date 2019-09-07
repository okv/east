'use strict';

const tap = require('tap');
const expect = require('expect.js');
const _ = require('underscore');
const testUtils = require('../../../testUtils');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

const describeTitle = (
	'migrator migrate with plugin hooks and migrate error'
);

describe(describeTitle, () => {
	let migrator;
	let plugin;
	let migration;
	const migrateError = new Error('Migrate error');

	const calledPluginHooks = [];

	before(() => {
		migrator = new Migrator();

		migrator._createAdapter = () => testUtils.createAdapter();

		plugin = testUtils.createPlugin({
			beforeMigrate: (params) => {
				calledPluginHooks.push({
					name: 'beforeMigrate',
					args: [params]
				});
			},
			afterMigrate: (params) => {
				calledPluginHooks.push({
					name: 'afterMigrate',
					args: [params]
				});
			},
			migrateError: (params) => {
				calledPluginHooks.push({
					name: 'migrateError',
					args: [params]
				});
			}
		});

		migration = testUtils.makeMigration({
			migrate: () => Promise.reject(migrateError)
		});

		return migrator.configure({plugins: [plugin]});
	});

	it('should throw an error', () => {
		return Promise.resolve()
			.then(() => {
				return migrator.migrate(migration);
			})
			.then((result) => {
				throw new Error(`Error expected, but got result: ${result}`);
			})
			.catch((err) => {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).match(/^Error during migrate/);
			});
	});

	it('should call plugin hooks', () => {
		expect(calledPluginHooks).length(2);
		expect(calledPluginHooks[0].name).equal('beforeMigrate');
		expect(calledPluginHooks[0].args).length(1);
		expect(calledPluginHooks[0].args[0]).an(Object);
		expect(calledPluginHooks[0].args[0]).only.keys(
			'migration', 'migrationParams'
		);
		expect(calledPluginHooks[0].args[0].migration).eql(
			_(migration).pick('name')
		);
		expect(calledPluginHooks[1].name).equal('migrateError');
		expect(calledPluginHooks[1].args).length(1);
		expect(calledPluginHooks[1].args[0]).an(Object);
		expect(calledPluginHooks[1].args[0]).only.keys(
			'migration', 'migrationParams', 'error'
		);
		expect(calledPluginHooks[1].args[0].migration).eql(
			_(migration).pick('name')
		);
		expect(calledPluginHooks[1].args[0].error).equal(migrateError);
	});
});
