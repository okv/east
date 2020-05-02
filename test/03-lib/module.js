'use strict';

const tap = require('tap');
const expect = require('expect.js');
const libModule = require('../../lib');
const MigrationManager = require('../../lib/migrationManager');
const packageJson = require('../../package.json');

tap.mochaGlobals();

describe('module', () => {
	it('should export only MigrationManager', () => {
		expect(libModule).only.keys('MigrationManager');
		expect(libModule.MigrationManager).eql(MigrationManager);
	});

	it('should have lib/index.js as main in package.json', () => {
		expect(packageJson.main).equal('lib/index.js');
	});

	it('should have lib/index.d.ts as types in package.json', () => {
		expect(packageJson.types).equal('lib/index.d.ts');
	});

	it('should have bin/east.js as bin.east in package.json', () => {
		expect(packageJson.bin.east).equal('bin/east.js');
	});
});
