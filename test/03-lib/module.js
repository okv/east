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

	it('shoule be set as main in package.json', () => {
		expect(packageJson.main).equal('lib/index.js');
	});
});
