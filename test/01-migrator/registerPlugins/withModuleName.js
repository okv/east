const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../../testUtils');
const Migrator = require('../../../lib/migrator');

tap.mochaGlobals();

const describeTitle = (
	'migrator configure register plugins with module name'
);

describe(describeTitle, () => {
	let migratorMock;
	let plugin;

	const calledPluginMethods = [];
	const loadModulePaths = [];

	before(() => {
		migratorMock = new Migrator();

		migratorMock._createAdapter = () => testUtils.createAdapter();

		migratorMock._loadModule = (path) => {
			loadModulePaths.push(path);

			if (loadModulePaths.length === 1) {
				return Promise.resolve(plugin);
			} else {
				return Promise.reject(new Error('Some error'));
			}
		};

		plugin = testUtils.createPlugin({
			register: (params) => {
				calledPluginMethods.push({
					name: 'register',
					args: [params]
				});
			}
		});
	});

	it('should be done without error', () => {
		return migratorMock.configure({plugins: ['@scope/somePlugin']});
	});

	it('should try only module name', () => {
		expect(loadModulePaths).length(1);
		expect(loadModulePaths[0]).eql('@scope/somePlugin');
	});

	it('should call plugin register', () => {
		expect(calledPluginMethods).length(1);
		expect(calledPluginMethods[0].name).equal('register');
		expect(calledPluginMethods[0].args).length(1);
		expect(calledPluginMethods[0].args[0]).an('object');
		expect(calledPluginMethods[0].args[0]).have.keys(
			'migratorParams', 'migratorHooks'
		);
	});
});
