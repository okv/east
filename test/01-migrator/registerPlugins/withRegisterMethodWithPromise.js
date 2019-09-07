'use strict';

const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

const describeTitle = (
	'migrator configure register plugins with register method with promise'
);

describe(describeTitle, () => {
	let migratorMock;
	let pluginMock;

	const calledPluginMethods = [];

	before(() => {
		migratorMock = new Migrator();

		migratorMock._createAdapter = () => testUtils.createAdapter();

		migratorMock._tryLoadModule = () => {
			throw new Error('Some error');
		};

		pluginMock = testUtils.createPlugin({
			register: (params) => {
				return new Promise((resolve) => {
					setImmediate(() => {
						calledPluginMethods.push({
							name: 'register',
							args: [params]
						});

						resolve();
					});
				});
			}
		});
	});

	it('should be done without error', () => {
		return migratorMock.configure({plugins: [pluginMock]});
	});

	it('should call plugin register', () => {
		expect(calledPluginMethods).length(1);
		expect(calledPluginMethods[0].name).equal('register');
		expect(calledPluginMethods[0].args).length(1);
		expect(calledPluginMethods[0].args[0]).an('object');
		expect(calledPluginMethods[0].args[0]).have.keys('config', 'migrator');
	});
});
