'use strict';

const _ = require('underscore');
const tap = require('tap');
const expect = require('expect.js');
const testUtils = require('../../testUtils');
const Migrator = require('../../lib/migrator');

tap.mochaGlobals();

describe('migrator', () => {
	let migrator;

	before(() => {
		return Promise.resolve()
			.then(() => testUtils.createMigrator({init: true, connect: true}))
			.then((createdMigrator) => {
				migrator = createdMigrator;
			});
	});

	after(() => testUtils.destroyMigrator({migrator}));

	describe('adapter', () => {
		// just log used adapter name, useful for integration testing with
		// different adapters
		it(`should have a name "${migrator.params.adapter}"`, _.noop);
	});

	const migration = testUtils.makeMigration();
	['migrate', 'rollback'].forEach((action) => {
		describe(action, () => {
			it('good migration should be ok', () => migrator[action](migration));

			it('migration which produce eror should pass it', () => {
				migration[action] = () => {
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
			one: testUtils.makeMigration({name: 'one', tags: ['one']}),
			two: testUtils.makeMigration({name: 'two', tags: ['one', 'two']}),
			three: testUtils.makeMigration({name: 'three', tags: []}),
			four: testUtils.makeMigration()
		};

		describe('by tag', () => {
			let loadMigration;
			before(() => {
				loadMigration = Migrator.prototype.loadMigration;

				Migrator.prototype.loadMigration = (name) => {
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
							names: _(migrationNamesHash).keys(),
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
							names: _(migrationNamesHash).keys(),
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
							names: _(migrationNamesHash).keys(),
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
							names: _(migrationNamesHash).keys(),
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
							names: _(migrationNamesHash).keys(),
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
							names: _(migrationNamesHash).keys(),
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
							names: _(migrationNamesHash).keys(),
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
