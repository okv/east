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

	const publicMethodNames = [
		'configure',
		'getParams',
		'init',
		'isMigrationsDirExist',
		'create',
		'getMigrationPath',
		'connect',
		'getMigrationNames',
		'migrate',
		'rollback',
		'disconnect'
	];

	_(publicMethodNames).each((publicMethodName) => {
		it(`should have "${publicMethodName}" public method`, () => {
			expect(MigrationManager.prototype).have.keys(publicMethodName);
		});
	});
});
