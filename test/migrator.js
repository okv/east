'use strict';

var expect = require('expect.js'),
	Migrator = require('../lib/migrator'),
	Path = require('path');

describe('migrator', function() {
	var migrator = new Migrator();

	it('connect', function(done) {
		migrator.connect(done);
	});

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
				if (!executedNames.length) return done();

				var funcs = executedNames.map(function(name, index) {
					return function() {
						migrator.adapter.unmarkExecuted(name, function(err) {
							if (err) done(err);
							if (index < funcs.length - 1) funcs[++index]();
						});
					};
				});
				funcs.push(done);
				funcs[0]();
			});
		});
	});

	var baseNames = ['first', 'second', 'third', 'second'];
	var names = [];

	describe('create', function() {
		it('expect create without errors', function(done) {
			var funcs = baseNames.map(function(baseName, index) {
				return function() {
					migrator.create(baseName, function(err, name) {
						if (err) done(err);
						names.push(name);
						if (index < funcs.length - 1) funcs[++index]();
					});
				};
			});
			funcs.push(done);
			funcs[0]();
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
				migrator.migrate(migration, done);
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

	describe('names normalization', function() {
		it('by path should be ok', function(done) {
			var name = names[0],
				path = Path.join('migrations', name);
			migrator.normalizeNames([name], function(err, normalizedNames) {
				if (err) done(err);
				expect(normalizedNames[0]).equal(name);
				done();
			});
		});

		it('by full name should be ok', function(done) {
			var name = names[0];
			migrator.normalizeNames([name], function(err, normalizedNames) {
				if (err) done(err);
				expect(normalizedNames[0]).equal(name);
				done();
			});
		});

		it('by number should be ok', function(done) {
			var number = 1,
				name = names[0];
			migrator.normalizeNames([number], function(err, normalizedNames) {
				if (err) done(err);
				expect(normalizedNames[0]).equal(name);
				done();
			});
		});

		it('by basename should be ok', function(done) {
			var baseName = baseNames[0],
				name = names[0];
			migrator.normalizeNames([baseName], function(err, normalizedNames) {
				if (err) done(err);
				expect(normalizedNames[0]).equal(name);
				done();
			});
		});

		it('by ambiguous basename should return an error', function(done) {
			var baseName = baseNames[1];
			migrator.normalizeNames([baseName], function(err, normalizedNames) {
				expect(err).ok();
				expect(err).an(Error);
				expect(err.message).contain(
					'Specified migration name `' + baseName + '` is ambiguous'
				);
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

	var migration = {};
	migration.name = '9999_test';
	migration.migrate = function(client, done) {
		done();
	};
	migration.rollback = function(client, done) {
		done();
	};

	describe('validate', function() {
		it('valid migration should be ok', function(done) {
			migrator.validateMigration(migration, done);
		});
	});

	['migrate', 'rollback'].forEach(function(action) {
		describe(action, function() {
			it('good migration should be ok', function(done) {
				migrator[action](migration, done);
			});

			it('migration which produce eror should pass it', function(done) {
				migration[action] = function(client, done) {
					done(new Error('Test ' + action + ' error'));
				};
				migrator[action](migration, function(err) {
					expect(err).ok();
					expect(err).a(Error);
					expect(err).have.property(
						'message', 'Test ' + action + ' error'
					);
					done();
				});
			});
		});
	});
});
