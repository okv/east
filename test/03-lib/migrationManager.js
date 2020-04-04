'use strict';

const _ = require('underscore');
const tap = require('tap');
const expect = require('expect.js');
const MigrationManager = require('../../lib/migrationManager');

tap.mochaGlobals();

describe('MigrationManager', () => {
	it('should have prototype', () => {
		expect(MigrationManager.prototype).ok();
	});

	const allowedPublicMethodNames = [
		'configure',
		'getParams',
		'init',
		'isInitialized',
		'create',
		'getMigrationPath',
		'getMigrationSourcePath',
		'connect',
		'getMigrationNames',
		'migrate',
		'rollback',
		'disconnect'
	];

	_(allowedPublicMethodNames).each((publicMethodName) => {
		it(`should have "${publicMethodName}" public method`, () => {
			expect(MigrationManager.prototype).have.keys(publicMethodName);
		});
	});

	it('should not have other public methods', () => {
		const allPublicMethodNames = _(MigrationManager.prototype)
			.chain()
			.functions()
			.filter((methodName) => _(MigrationManager.prototype).has(methodName))
			.reject((methodName) => methodName.charAt(0) === '_')
			.value();

		const difference = _(allPublicMethodNames).difference(
			allowedPublicMethodNames
		);

		expect(difference).eql([]);
	});
});
