'use strict';

let expect = require('expect.js'),
	Migrator = require('../lib/migrator'),
	pathUtils = require('path'),
	Steppy = require('twostep').Steppy,
	pEachSeries = require('p-each-series'),
	pMap = require('p-map'),
	pProps = require('p-props'),
	utils = require('../lib/utils');

describe('migrator', () => {
	const migrator = new Migrator();

	const createMigrations = (baseNames) => {
		return pMap(baseNames, (baseName) => {
			return migrator.create(baseName);
		}, {concurrency: 1});
	};

	const removeMigrations = (names) => {
		return pMap(names, (name) => migrator.remove(name));
	};

	before(() => {
		return Promise.resolve()
			.then(() => {
				return migrator.connect();
			})
			.then(() => {
				return pProps({
					allNames: migrator.getAllMigrationNames(),
					executedNames: migrator.adapter.getExecutedMigrationNames()
				});
			})
			.then((result) => {
				// remove all existing migrations and unmark all executed
				return Promise.all([
					removeMigrations(result.allNames),
					pMap(result.executedNames, (name) => {
						return migrator.adapter.unmarkExecuted(name);
					})
				]);
			});
	});

	// just output currently used adapter
	it(`uses adapter ${migrator.params.adapter}`, () => {});

	describe('adapter', () => {
		let tryLoad,
			mockAdapter = function () {
				this.getTemplatePath = function () {};
			};

		before(() => {
			tryLoad = Migrator.prototype._tryLoadAdapter;
		});

		it('expect be loaded migrator-related first and than CWD-related',
			() => {
				const paths = [];
				Migrator.prototype._tryLoadAdapter = function (path) {
					paths.push(path);
					return paths.length === 2 ? mockAdapter : new Error('Whatever.');
				};

				new Migrator({
					adapter: 'X'
				});

				expect(paths[0]).eql('X');
				expect(paths[1].substr(-2, 2)).eql('/X');
			});

		it('expect to throw when both paths can not be resolved', () => {
			Migrator.prototype._tryLoadAdapter = function () {
				return new Error('Whatever.');
			};

			expect(() => {
				new Migrator({
					adapter: 'X'
				});
			}).to.throwError(/Whatever./);
		});

		after(() => {
			Migrator.prototype._tryLoadAdapter = tryLoad;
		});
	});

	describe('create', () => {
		let baseNames = ['first', 'second', 'third', 'second'],
			names = [];

		after(() => removeMigrations(names));

		it('should create migrations sequentially without errors', () => {
			return Promise.resolve()
				.then(() => createMigrations(baseNames))
				.then((migrationNames) => {
					names = migrationNames;
				});
		});

		it('created migrations should have sequential numbers', () => {
			const expectedNames = baseNames.map((baseName, index) => {
				return `${String(index + 1)}_${baseName}`;
			});

			expect(names).eql(expectedNames);
		});

		it('created migrations should exist', () => {
			return migrator.checkMigrationsExists(names);
		});

		it('created migrations should be loadable', () => {
			return pEachSeries(names, (name) => migrator.loadMigration(name));
		});

		it('created migrations should be listed as `new`', () => {
			return Promise.resolve()
				.then(() => migrator.getNewMigrationNames())
				.then((newNames) => expect(newNames).eql(names));
		});
	});

	describe('getAllMigrationNames', () => {
		let expectedNames = [];

		before(() => {
			return Promise.resolve()
				.then(() => {
					let baseNames = [],
						zCharcode = 'z'.charCodeAt(0);

					for (let index = 0; index < 12; index++) {
						const baseName = String.fromCharCode(zCharcode - index);

						baseNames.push(baseName);
					}

					return createMigrations(baseNames);
				})
				.then((migrationNames) => {
					expectedNames = migrationNames;
				});
		});

		after(() => removeMigrations(expectedNames));

		it('should return numeric sorted names', () => {
			return Promise.resolve()
				.then(() => migrator.getAllMigrationNames())
				.then((names) => expect(names).eql(expectedNames));
		});
	});

	describe('execute', () => {
		let baseNames = ['first', 'second', 'third', 'second'],
			names = [];

		before(() => {
			return Promise.resolve()
				.then(() => createMigrations(baseNames))
				.then((migrationNames) => {
					names = migrationNames;
				});
		});

		after(() => removeMigrations(names));

		it('execute migration without errors', () => {
			return Promise.resolve()
				.then(() => migrator.loadMigration(names[0]))
				.then((migration) => migrator.migrate(migration));
		});

		it('migration should be listed as `executed` after that', () => {
			return Promise.resolve()
				.then(() => migrator.adapter.getExecutedMigrationNames())
				.then((executedNames) => expect(executedNames).eql([names[0]]));
		});

		it(
			'execution of the same migration with force flag should passes ' +
			'without errors',
			() => {
				return Promise.resolve()
					.then(() => migrator.loadMigration(names[0]))
					.then((migration) => {
						migration.force = true;

						return migrator.migrate(migration);
					});
			}
		);

		it('migration should still be listed as `executed`', () => {
			return Promise.resolve()
				.then(() => migrator.adapter.getExecutedMigrationNames())
				.then((executedNames) => expect(executedNames).eql([names[0]]));
		});
	});

	describe('rollback', () => {
		let baseNames = ['first', 'second', 'third', 'second'],
			names = [];

		before(() => {
			return Promise.resolve()
				.then(() => createMigrations(baseNames))
				.then((migrationNames) => {
					names = migrationNames;
				});
		});

		after(() => removeMigrations(names));

		it('rollback executed migration without errors', () => {
			return Promise.resolve()
				.then(() => migrator.loadMigration(names[0]))
				.then((migration) => migrator.rollback(migration));
		});

		it('expect that no `executed` migration at list', () => {
			return Promise.resolve()
				.then(() => migrator.adapter.getExecutedMigrationNames())
				.then((executedNames) => expect(executedNames).have.length(0));
		});

		it('expect that all migrations lists as `new` again', () => {
			return Promise.resolve()
				.then(() => migrator.getNewMigrationNames())
				.then((newNames) => expect(newNames).eql(names));
		});
	});

	describe('names normalization', () => {
		let baseNames = ['first', 'second', 'third', 'second'],
			names = [];

		before(() => {
			return Promise.resolve()
				.then(() => createMigrations(baseNames))
				.then((migrationNames) => {
					names = migrationNames;
				});
		});

		after(() => removeMigrations(names));

		const nomrmalizeAndCheckName = (inputName, expectedName) => {
			return Promise.resolve()
				.then(() => migrator.normalizeNames([inputName]))
				.then((normalizedNames) => {
					expect(normalizedNames[0]).equal(expectedName);
				});
		};

		it('by path should be ok', () => {
			let name = names[0],
				path = pathUtils.join('migrations', name);

			return nomrmalizeAndCheckName(path, name);
		});

		it('by full name should be ok', () => {
			const name = names[0];

			return nomrmalizeAndCheckName(name, name);
		});

		it('by number should be ok', () => {
			let number = '1',
				name = names[0];

			return nomrmalizeAndCheckName(number, name);
		});

		it('by basename should be ok', () => {
			let baseName = baseNames[0],
				name = names[0];

			return nomrmalizeAndCheckName(baseName, name);
		});

		it('by ambiguous basename should return an error', () => {
			const baseName = baseNames[1];

			return Promise.resolve()
				.then(() => migrator.normalizeNames([baseName]))
				.then((result) => {
					throw new Error(`Error expected, but got result: ${result}`);
				})
				.catch((err) => {
					expect(err).ok();
					expect(err).an(Error);
					expect(err.message).contain(
						`Specified migration name \`${baseName}\` is ambiguous`
					);
				});
		});
	});

	describe('remove', () => {
		let baseNames = ['first', 'second', 'third', 'second'],
			names = [];

		before(() => {
			return Promise.resolve()
				.then(() => createMigrations(baseNames))
				.then((migrationNames) => {
					names = migrationNames;
				});
		});

		it('expect remove without errors', () => removeMigrations(names));

		it('removed migrations should not exist', () => {
			return Promise.resolve()
				.then(() => {
					return pMap(names, (name) => {
						return migrator.isMigrationExists(name);
					});
				})
				.then((existResults) => {
					existResults.forEach((existResult) => {
						expect(existResult).equal(false);
					});
				});
		});
	});

	const makeMigration = (params) => {
		const migration = {};
		migration.name = '9999_test';

		migration.migrate = (client, done) => {
			done();
		};
		migration.rollback = (client, done) => {
			done();
		};

		return utils.extend(migration, params);
	};

	let migration;

	describe('validate', () => {
		it('valid migration should be ok', () => {
			migration = makeMigration();

			return migrator.validateMigration(migration);
		});

		const validateAndCheckError = (migration, errorMessage) => {
			return Promise.resolve()
				.then(() => migrator.validateMigration(migration))
				.then((result) => {
					throw new Error(`Error expected, but got result: ${result}`);
				})
				.catch((err) => {
					expect(err).ok();
					expect(err).an(Error);
					expect(err.message).eql(errorMessage);
				});
		};

		let errorMessage;
		it('non object migration should fail', () => {
			errorMessage = 'migration is not an object';

			return validateAndCheckError(1, errorMessage);
		});

		it('migration without migrate function should fail', () => {
			migration = makeMigration();
			delete migration.migrate;
			errorMessage = '`migrate` function is not set';

			return validateAndCheckError(migration, errorMessage);
		});

		it('migration with non function migrate should fail', () => {
			migration = makeMigration();
			migration.migrate = 1;
			errorMessage = '`migrate` is not a function';

			return validateAndCheckError(migration, errorMessage);
		});

		it('migration without rollback should be ok', () => {
			migration = makeMigration();
			delete migration.rollback;

			return migrator.validateMigration(migration);
		});

		it('migration with non function rollback should fail', () => {
			migration = makeMigration();
			migration.rollback = 1;
			errorMessage = '`rollback` set but it`s not a function';

			return validateAndCheckError(migration, errorMessage);
		});

		it('migration with non array tags should fail', () => {
			migration = makeMigration();
			migration.tags = 1;
			errorMessage = '`tags` set but it`s not an array';

			return validateAndCheckError(migration, errorMessage);
		});

		it('migration with tags array should be ok', () => {
			migration = makeMigration();
			migration.tags = ['one', 'two'];

			return migrator.validateMigration(migration);
		});
	});

	migration = makeMigration();
	['migrate', 'rollback'].forEach((action) => {
		describe(action, () => {
			it('good migration should be ok', () => migrator[action](migration));

			it('migration which produce eror should pass it', () => {
				migration[action] = (client) => {
					throw new Error(`Test ${action} error`);
				};

				return Promise.resolve()
					.then(() => migrator[action](migration))
					.then((result) => {
						throw new Error(`Error expected, but got result: ${result}`);
					})
					.catch((err) => {
						expect(err).ok();
						expect(err).an(Error);
						expect(err.message).equal(
							`Error during ${action} "${migration.name
							}": Test ${action} error`
						);
					});
			});
		});
	});

	describe('filter', () => {
		const migrationNamesHash = {
			one: makeMigration({name: 'one', tags: ['one']}),
			two: makeMigration({name: 'two', tags: ['one', 'two']}),
			three: makeMigration({name: 'three', tags: []}),
			four: makeMigration()
		};

		describe('by tag', () => {
			let loadMigration;
			before(() => {
				loadMigration = Migrator.prototype.loadMigration;

				Migrator.prototype.loadMigration = (name, callback) => {
					return Promise.resolve(migrationNamesHash[name]);
				};
			});

			after(() => {
				Migrator.prototype.loadMigration = loadMigration;
			});

			it('with wrong tag expression, should fail', () => {
				return Promise.resolve()
					.then(() => {
						return migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'one *'
						});
					})
					.then((result) => {
						throw new Error(`Error expected, but got result: ${result}`);
					})
					.catch((err) => {
						expect(err).ok();
						expect(err.message).contain('unexpected token "*"');
					});
			});

			it('with tag one, should get proper migrations', () => {
				return Promise.resolve()
					.then(() => {
						return migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'one'
						});
					})
					.then((result) => {
						expect(result).eql({names: ['one', 'two']});
					});
			});

			it('with tag two, should get proper migrations', () => {
				return Promise.resolve()
					.then(() => {
						return migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'two'
						});
					})
					.then((result) => {
						expect(result).eql({names: ['two']});
					});
			});

			it('with tag with no migrations, should get nothing', () => {
				return Promise.resolve()
					.then(() => {
						return migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'three'
						});
					})
					.then((result) => {
						expect(result).eql({names: []});
					});
			});

			it('with tag one or two, should get proper migrations', () => {
				return Promise.resolve()
					.then(() => {
						return migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'one | two'
						});
					})
					.then((result) => {
						expect(result).eql({names: ['one', 'two']});
					});
			});

			it('with tag one and two, should get proper migrations', () => {
				return Promise.resolve()
					.then(() => {
						return migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: 'one & two'
						});
					})
					.then((result) => {
						expect(result).eql({names: ['two']});
					});
			});

			it('with tag not two, should get proper migrations', () => {
				return Promise.resolve()
					.then(() => {
						return migrator.filterMigrationNames({
							by: 'tag',
							names: utils.keys(migrationNamesHash),
							tag: '!two'
						});
					})
					.then((result) => {
						expect(result).eql({names: ['one', 'three', '9999_test']});
					});
			});
		});
	});
});
