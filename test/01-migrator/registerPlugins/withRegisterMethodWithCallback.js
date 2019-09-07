'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

const describeTitle = (
	'migrator configure register plugins with register method with callback'
);

describe(describeTitle, () => {
	let migratorMock;
	let plugin;

	const calledPluginMethods = [];

	before(() => {
		migratorMock = new Migrator();

		migratorMock._createAdapter = () => testUtils.createAdapter();

		migratorMock._tryLoadModule = () => {
			throw new Error('Some error');
		};

		plugin = testUtils.createPlugin({
			register: (params, callback) => {
				setImmediate(() => {
					calledPluginMethods.push({
						name: 'register',
						args: [params]
					});

					callback();
				});
			}
		});
	});

	it('should be done without error', () => {
		return migratorMock.configure({plugins: [plugin]});
	});

	it('should call plugin register', () => {
		expect(calledPluginMethods).length(1);
		expect(calledPluginMethods[0].name).equal('register');
		expect(calledPluginMethods[0].args).length(1);
		expect(calledPluginMethods[0].args[0]).an('object');
		expect(calledPluginMethods[0].args[0]).have.keys('config', 'migrator');
	});
});
