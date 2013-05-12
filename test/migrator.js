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

		it('unmark all executed', function(done) {
			migrator.adapter.getExecutedMigrationNames(function(err, executedNames) {
				if (err) done(err);
				executedNames.forEach(function(name) {
					migrator.adapter.unmarkExecuted(name);
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

		it('expect that created migrations are exists', function(done) {
			migrator.checkMigrationsExists(names, done);
		});

		it('and loadable', function(done) {
			var loadedCount = 0;
			names.forEach(function(name) {
				migrator.loadMigration(name, function(err, migration) {
					if (err) done(err);
					loadedCount++;
					if (loadedCount == names.length) done();
				});
			});
		});

		it('and lists as `new`', function(done) {
			migrator.getNewMigrationNames(function(err, newNames) {
				if (err) done(err);
				expect(newNames).eql(names);
				done();
			});
		});
	});

	describe('execute', function() {
		it('execute first of them without errors', function(done) {
			migrator.loadMigration(names[0], function(err, migration) {
				if (err) done(err);
				migrator.execute(migration, done);
			});
		});

		it('expect that it lists as `executed`', function(done) {
			migrator.adapter.getExecutedMigrationNames(function(err, executedNames) {
				if (err) done(err);
				expect(executedNames).eql([names[0]]);
				done();
			});
		});
	});

	describe('rollback', function() {
		it('rollback which one that was executed without errors', function(done) {
			migrator.loadMigration(names[0], function(err, migration) {
				if (err) done(err);
				migrator.rollback(migration, done);
			});
		});

		it('expect that no `executed` migration at list', function(done) {
			migrator.adapter.getExecutedMigrationNames(function(err, executedNames) {
				if (err) done(err);
				expect(executedNames).have.length(0);
				done();
			});
		});

		it('expect that all migrations lists as `new` again', function(done) {
			migrator.getNewMigrationNames(function(err, newNames) {
				if (err) done(err);
				expect(newNames).eql(names);
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
