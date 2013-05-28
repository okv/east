#!/usr/bin/env node

var program = require('commander'),
	fs = require('fs'),
	Migrator = require('../lib/migrator');


program
	.version('0.1.0')
	.option('--adapter <name>', 'which db adapter to use')
	.option('--config <path>', 'config file to use')
	.option('--timeout <timeout>', 'timeout for migrate/rollback')
	.option('--template <path>', 'path to template for new migrations')
	.option('--dir <dir>', 'dir where migrations stored');


/**
 * Create new migration based on template
 */
program
	.command('create <basename>')
	.description('create new migration based on template')
	.action(function(basename) {
		var migrator = new Migrator(program);
		migrator.create(basename, function(err, name) {
			if (err) handleError(err);
			console.log(
				'New migration `' + name + '` created at ' +
				migrator.getMigrationPathByName(name)
			);
		});
	});


/**
 * Migrate
 */
program
	.command('migrate [migrations]')
	.option('-f, --force', 'force to execute already executed migrations')
	.description('run all or selected migrations')
	.action(function(names, command) {
		var migrator = new Migrator(program);
		migrator.connect(function(err) {
			if (err) handleError(err);
			if (!names) {
				migrator.getNewMigrationNames(migrate);
			} else {
				separateNames(names);
			}
		});
		function separateNames(names) {
			names = names.split(',');
			migrator.checkMigrationsExists(names, function(err) {
				if (err) handleError(err);
				if (command.force) {
					migrate(null, names);
				} else {
					migrator.separateNames(
						names,
						function(err, newNames, executedNames) {
							if (err) handleError(err);
							executedNames.forEach(function(name) {
								console.log(
									'skip `' + name + '` because it`s ' +
									'already executed'
								);
							});
							migrate(null, newNames);
						}
					);
				}
			});
		}
		function migrate(err, names) {
			if (err) handleError(err);
			if (!names || !names.length) {
				console.log('nothing to migrate');
				return;
			}
			console.log('target migrations:\n\t' + names.join('\n\t'));
			var funcs = names.map(function(name, index) {
				return function() {
					console.log('migrate `' + name + '`')
					migrator.loadMigration(name, function(err, migration) {
						if (err) handleError(err);
						migrator.execute(migration, function(err) {
							if (err) handleError(err);
							console.log('migration done')
							// call next
							if (index < funcs.length - 1) funcs[++index]();
						});
					});
				};
			});
			funcs.push(function() {
				migrator.disconnect();
			});
			// starts migrations execution
			funcs[0]();
		}
	});


/**
 * Rollback
 */
program
	.command('rollback [migrations]')
	.description('rollback all or selected migrations')
	.action(function(names) {
		var migrator = new Migrator(program);
		migrator.connect(function(err) {
			if (err) handleError(err);
			if (!names) {
				migrator.adapter.getExecutedMigrationNames(function(err, names) {
					separateNames(names.reverse());
				});
			} else {
				rollback(null, names.split(','));
			}
		});
		function separateNames(names) {
			migrator.checkMigrationsExists(names, function(err) {
				if (err) handleError(err);
				migrator.separateNames(
					names,
					function(err, newNames, executedNames) {
						if (err) handleError(err);
						newNames.forEach(function(name) {
							console.log(
								'skip `' + name + '` because it`s ' +
								'not executed yet'
							);
						});
						rollback(null, executedNames);
					}
				);
			});
		}
		function rollback(err, names) {
			if (err) handleError(err);
			if (!names || !names.length) {
				console.log('nothing to rollback');
				return;
			}
			console.log('target migrations:\n\t' + names.join('\n\t'));
			var funcs = names.map(function(name, index) {
				function rollbackNext() {
					if (index < funcs.length - 1) funcs[++index]();
				}
				return function() {
					migrator.loadMigration(name, function(err, migration) {
						if (err) handleError(err);
						if (!migration.rollback) {
							console.log(
								'skip `' + name + '` cause rollback function ' +
								'is not set'
							);
							rollbackNext();
						} else {
							console.log('rollback `' + name + '`')
							migrator.rollback(migration, function(err) {
								if (err) handleError(err);
								console.log('migration successfully rolled back');
								rollbackNext();
							});
						}
					});
				};
			});
			funcs.push(function() {
				migrator.disconnect();
			});
			funcs[0]();
		}
	});


/**
 * List migrations
 */
program
	.command('list')
	.option(
		'-s, --status <status>', 'which migrations to list (`new`, ' +
		'`executed` or `all`), `new` by default'
	)
	.description('list migrations')
	.action(function(command) {
		var migrator = new Migrator(program),
			status = command.status || 'new';
		console.log(status + ' migrations:');
		migrator.connect(function(err) {
			if (err) handleError(err);
			migrator.getMigrationNames(status, function(err, migrations) {
				if (err) handleError(err);
				migrations.forEach(function(migration) {
					console.log('\t', migration);
				});
				migrator.disconnect();
			});
		});
	});


/**
 * Default command
 */
program
	.command('*')
	.action(function(command) {
		handleError(new Error('Unrecognized command `' + command + '`'));
	});


/**
 * Helpers used above
 */
function handleError(err) {
	throw err;
};


// let's start the party (program entry point)
program.parse(process.argv);
// FIXME: 	show help if no one command is selected
// if (!program.args.length) program.help();
