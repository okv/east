'use strict';

var expect = require('expect.js'),
	Migrator = require('../lib/migrator');

describe('migrator', function() {
	var migrator = new Migrator();

	describe('clean', function() {
		it('remove all existing migrations', function(done) {
			migrator.getAllMigrationNames(function(err, allNames) {
				if (err) done(err);
				allNames.forEach(function(name) {
					migrator.remove(name);
				});
				done();
			});
		});
	});

	var baseNames = ['first', 'second', 'third'];
	var names = null;

	describe('create', function() {
		it('expect create without errors', function(done) {
			names = baseNames.map(function(baseName) {
				return migrator.create(baseName);
			});
			done();
		});

		it('expect that created migrations are loadable', function(done) {
			var loadedCount = 0;
			names.forEach(function(name) {
				migrator.loadMigration(name, function(err, migration) {
					if (err) done(err);
					loadedCount++;
					if (loadedCount == names.length) done();
				});
			});
		});

		it('expect that they listed as `new`', function(done) {
			migrator.getNewMigrationNames(function(err, newNames) {
				if (err) done(err);
				expect(newNames).have.length(names.length);
				names.forEach(function(name, index) {
					expect(newNames[index]).contain(name);
				});
				done();
			});
		});
	});

	describe('remove', function() {
		it('expect remove without errors', function(done) {
			names.forEach(function(name) {
				return migrator.remove(name);
			});
			done();
		});
	});
});
