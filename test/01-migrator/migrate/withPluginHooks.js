'use strict';

const tap = require('tap');
const expect = require('expect.js');
const _ = require('underscore');
const testUtils = require('../../../testUtils');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

const describeTitle = (
	'migrator migrate with plugin hooks'
);

describe(describeTitle, () => {
	let migrator;
	let plugin;
	let migration;

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
			}
		});

		migration = testUtils.makeMigration();

		return migrator.configure({plugins: [plugin]});
	});

	it('should be done without error', () => {
		return migrator.migrate(migration);
	});

	it('should call plugin hooks', () => {
		expect(calledPluginHooks).length(2);
		expect(calledPluginHooks[0].name).equal('beforeMigrate');
		expect(calledPluginHooks[0].args).length(1);
		expect(calledPluginHooks[0].args[0]).an(Object);
		expect(calledPluginHooks[0].args[0]).only.keys('migration');
		expect(calledPluginHooks[0].args[0].migration).eql(
			_(migration).pick('name')
		);
		expect(calledPluginHooks[1].name).equal('afterMigrate');
		expect(calledPluginHooks[1].args).length(1);
		expect(calledPluginHooks[1].args[0]).an(Object);
		expect(calledPluginHooks[1].args[0]).only.keys('migration');
		expect(calledPluginHooks[1].args[0].migration).eql(
			_(migration).pick('name')
		);
	});
});
