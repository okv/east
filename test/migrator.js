'use strict';

var expect = require('expect.js'),
	Migrator = require('../lib/migrator'),
	Path = require('path'),
	Steppy = require('twostep').Steppy,
	utils = require('../lib/utils');

describe('migrator', function() {
	var migrator = new Migrator();

	before(function(done) {
		Steppy(
			function() {
				migrator.connect(this.slot());
			},
			function() {
				migrator.getAllMigrationNames(this.slot());

				migrator.adapter.getExecutedMigrationNames(this.slot());
			},
			function(err, allNames, executedNames) {
				// remove all existing migrations
				allNames.forEach(function(name) {
					migrator.remove(name);
				});

				// unmark all executed
				var unmarkGroup = this.makeGroup();
				executedNames.forEach(function(name) {
					migrator.adapter.unmarkExecuted(name, unmarkGroup.slot());
				});
			},
			done
		);
	});

	// just output currently used adapter
	it('uses adapter ' + migrator.params.adapter, function() {});

	describe('adapter', function() {
		var tryLoad,
			mockAdapter = function() {
				this.getTemplatePath = function() {};
			};

		before(function() {
			tryLoad = Migrator.prototype._tryLoadAdapter;
		});

		it('expect be loaded migrator-related first and than CWD-related', function(done) {
			var paths = [];
			Migrator.prototype._tryLoadAdapter = function(path) {
				paths.push(path);
				return paths.length === 2 ? mockAdapter : new Error('Whatever.');
			};

			new Migrator({
				adapter: 'X'
			});

			expect(paths[0]).eql('X');
			expect(paths[1].substr(-2, 2)).eql('/X');
			done();
		});

		it('expect to throw when both paths can not be resolved', function(done) {
			Migrator.prototype._tryLoadAdapter = function() {
				return new Error('Whatever.');
			};

			expect(function() {
				new Migrator({
					adapter: 'X'
				});
			}).to.throwError(/Whatever./);
			done();
		});

		after(function() {
			Migrator.prototype._tryLoadAdapter = tryLoad;
		});
	});

	var baseNames = ['first', 'second', 'third', 'second'],
		names = [];

	describe('create', function() {
		it('should create migrations sequentially without errors', function(done) {
			Steppy(
				function() {
					var funcs = baseNames.map(function(baseName) {
						return function() {
							var stepCallback = this.slot();
							migrator.create(baseName, function(err, name) {
								names.push(name);
								stepCallback(err, name);
							});
						};
					});
					funcs.push(this.slot());

					Steppy.apply(null, funcs);
				},
				done
			);
		});

		it('created migrations should have sequential numbers', function() {
			var expectedNames = baseNames.map(function(baseName, index) {
				return String(index + 1) + '_' + baseName;
			});
			expect(names).eql(expectedNames);
		});

		it('created migrations should exist', function(done) {
			migrator.checkMigrationsExists(names, done);
		});

		it('created migrations should be loadable', function(done) {
			Steppy(
				function() {
					var loadGroup = this.makeGroup();
					names.forEach(function(name) {
						migrator.loadMigration(name, loadGroup.slot());
					});
				},
				done
			);
		});

		it('created migrations should be listed as `new`', function(done) {
			Steppy(
				function() {
					migrator.getNewMigrationNames(this.slot());
				},
				function(err, newNames) {
					expect(newNames).eql(names);
					this.pass(null);
				},
				done
			);
		});
	});

	describe('execute', function() {
		it('execute migration without errors', function(done) {
			Steppy(
				function() {
					migrator.loadMigration(names[0], this.slot());
				},
				function(err, migration) {
					migrator.migrate(migration, this.slot());
				},
				done
			);
		});

		it('migration should be listed as `executed` after that', function(done) {
			Steppy(
				function() {
					migrator.adapter.getExecutedMigrationNames(this.slot());
				},
				function(err, executedNames) {
					expect(executedNames).eql([names[0]]);
					this.pass(null);
				},
				done
			);
		});

		it(
			'execution of the same migration with force flag should passes ' +
			'without errors',
			function(done) {
				Steppy(
					function() {
						migrator.loadMigration(names[0], this.slot());
					},
					function(err, migration) {
						migration.force = true;
						migrator.migrate(migration, this.slot());
					},
					done
				);
			}
		);

		it('migration should still be listed as `executed`', function(done) {
			Steppy(
				function() {
					migrator.adapter.getExecutedMigrationNames(this.slot());
				},
				function(err, executedNames) {
					expect(executedNames).eql([names[0]]);
					this.pass(null);
				},
				done
			);
		});
	});

	describe('rollback', function() {
		it('rollback executed migration without errors', function(done) {
			Steppy(
				function() {
					migrator.loadMigration(names[0], this.slot());
				},
				function(err, migration) {
					migrator.rollback(migration, this.slot());
				},
				done
			);
		});

		it('expect that no `executed` migration at list', function(done) {
			Steppy(
				function() {
					migrator.adapter.getExecutedMigrationNames(this.slot());
				},
				function(err, executedNames) {
					expect(executedNames).have.length(0);
					this.pass(null);
				},
				done
			);
		});

		it('expect that all migrations lists as `new` again', function(done) {
			Steppy(
				function() {
					migrator.getNewMigrationNames(this.slot());
				},
				function(err, newNames) {
					expect(newNames).eql(names);
					this.pass(null);
				},
				done
			);
		});
	});

	describe('names normalization', function() {

		var expectNomrmalizedName = function(inputName, expectedName, callback) {
			Steppy(
				function() {
					migrator.normalizeNames([inputName], this.slot());
				},
				function(err, normalizedNames) {
					expect(normalizedNames[0]).equal(expectedName);
					this.pass(null);
				},
				callback
			);
		};

		it('by path should be ok', function(done) {
			var name = names[0],
				path = Path.join('migrations', name);
			expectNomrmalizedName(path, name, done);
		});

		it('by full name should be ok', function(done) {
			var name = names[0];
			expectNomrmalizedName(name, name, done);
		});

		it('by number should be ok', function(done) {
			var number = '1',
				name = names[0];
			expectNomrmalizedName(number, name, done);
		});

		it('by basename should be ok', function(done) {
			var baseName = baseNames[0],
				name = names[0];
			expectNomrmalizedName(baseName, name, done);
		});

		it('by ambiguous basename should return an error', function(done) {
			var baseName = baseNames[1];
			Steppy(
				function() {
					migrator.normalizeNames([baseName], this.slot());

				},
				function(err) {
					expect(err).ok();
					expect(err).an(Error);
					expect(err.message).contain(
						'Specified migration name `' + baseName + '` is ambiguous'
					);
					done();
				}
			);
		});
	});

	describe('remove', function() {
		it('expect remove without errors', function() {
			names.forEach(function(name) {
				return migrator.remove(name);
			});
		});

		it('removed migrations should not exist', function(done) {
			Steppy(
				function() {
					var existGroup = this.makeGroup()
					names.forEach(function(name) {
						migrator.isMigrationExists(name, existGroup.slot());
					});
				},
				function(err, existResults) {
					existResults.forEach(function(existResult) {
						expect(existResult).equal(false);
					});
					this.pass(null);
				},
				done
			);
		});
	});

	var makeMigration = function(params) {
		var migration = {};
		migration.name = '9999_test';
		migration.migrate = function(client, done) {
			done();
		};
		migration.rollback = function(client, done) {
			done();
		};
		return utils.extend(migration, params);
	};

	var migration;

	describe('validate', function() {

		it('valid migration should be ok', function(done) {
			migration = makeMigration();
			migrator.validateMigration(migration, done);
		});

		var expectValidationError = function(migration, errorMessage, callback) {
			Steppy(
				function() {
					migrator.validateMigration(migration, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.message).eql(errorMessage);
					callback();
				}
			);
		};

		var errorMessage;
		it('non object migration should fail', function(done) {
			errorMessage = 'migration is not an object'
			expectValidationError(1, errorMessage, done);
		});

		it('migration without migrate function should fail', function(done) {
			migration = makeMigration();
			delete migration.migrate;
			errorMessage = '`migrate` function is not set';
			expectValidationError(migration, errorMessage, done);
		});

		it('migration with non function migrate should fail', function(done) {
			migration = makeMigration();
			migration.migrate = 1;
			errorMessage = '`migrate` is not a function';
			expectValidationError(migration, errorMessage, done);
		});

		it('migration without rollback should be ok', function(done) {
			migration = makeMigration();
			delete migration.rollback;
			migrator.validateMigration(migration, done);
		});

		it('migration with non function rollback should fail', function(done) {
			migration = makeMigration();
			migration.rollback = 1;
			errorMessage = '`rollback` set but it`s not a function';
			expectValidationError(migration, errorMessage, done);
		});

		it('migration with non array tags should fail', function(done) {
			migration = makeMigration();
			migration.tags = 1;
			errorMessage = '`tags` set but it`s not an array';
			expectValidationError(migration, errorMessage, done);
		});

		it('migration with tags array should be ok', function(done) {
			migration = makeMigration();
			migration.tags = ['one', 'two'];
			migrator.validateMigration(migration, done);
		});
	});

	migration = makeMigration();
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
						'message',
						'Error during ' + action + ' "' + migration.name +
						'": Test ' + action + ' error'
					);
					done();
				});
			});
		});
	});

	describe('filter', function() {

		var migrationNamesHash = {
			one: makeMigration({name: 'one', tags: ['one']}),
			two: makeMigration({name: 'two', tags: ['one', 'two']}),
			three: makeMigration({name: 'three', tags: []}),
			four: makeMigration()
		};

		describe('by tag', function() {
			var loadMigration;
			before(function() {
				loadMigration = Migrator.prototype.loadMigration;

				Migrator.prototype.loadMigration = function(name, callback) {
					callback(null, migrationNamesHash[name]);
				};
			});

			it('should get two', function(done) {
				Steppy(
					function() {
						migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'one'
						}, this.slot());
					},
					function(err, filterResult) {
						expect(filterResult).eql({names: ['one', 'two']});
						this.pass(null);
					},
					done
				);
			});

			it('should get one', function(done) {
				Steppy(
					function() {
						migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'two'
						}, this.slot());
					},
					function(err, filterResult) {
						expect(filterResult).eql({names: ['two']});
						this.pass(null);
					},
					done
				);
			});

			it('should get nothing', function(done) {
				Steppy(
					function() {
						migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'three'
						}, this.slot());
					},
					function(err, filterResult) {
						expect(filterResult).eql({names: []});
						this.pass(null);
					},
					done
				);
			});

			after(function() {
				Migrator.prototype.loadMigration = loadMigration;
			});
		});

	});
});
