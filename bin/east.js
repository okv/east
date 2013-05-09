#!/usr/bin/env node

var program = require('commander'),
	fs = require('fs'),
	Migrator = require('../lib/migrator');


program
	.version('0.1.0')
	.option('--config <path>', 'config file to use')
	.option('--adapter <name>', 'which db adapter to use')
	.option('--dir <dir>', 'dir where migrations stored');


/**
 * Create new migration based on template
 */
program
	.command('create <basename>')
	.description('create migration template')
	.action(function(basename) {
		var migrator = new Migrator(program),
			path = migrator.getMigrationPathByName(Date.now() + '_' + basename),
			templatePath = migrator.adapter.getTemplatePath();
		fs.createReadStream(templatePath).pipe(fs.createWriteStream(path));
		console.log('New migration created: ', path);
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
		if (!names) {
			migrator.getNewMigrationNames(migrate);
		} else {
			names = names.split(',');
			if (command.force) {
				migrate(null, names);
			} else {
				getOnlyNewMigrations(names, function(err, names) {
					if (err) handleError(err);
					if (names.length) migrate(null, names);
				});
			}
		}
		function getOnlyNewMigrations(names, callback) {
			migrator.adapter.getExecutedMigrationNames(function(err, executedNames) {
				var executedNamesHash = {};
				executedNames.forEach(function(name) {
					executedNamesHash[name] = 1;
				});
				names = names.filter(function(name) {
					if (name in executedNamesHash) {
						console.log(
							'skip `' + name + '` because it`s already executed'
						);
						return false;
					} else {
						return true;
					}
				});
				callback(null, names);
			});
		}
		function migrate(err, names) {
			if (err) handleError(err);
			console.log('Target migrations: \n\t', names.join('\n\t'));
			var funcs = names.map(function(name, index) {
				return function() {
					console.log('process ' + name)
					// check everething and execute
					migrator.isMigrationExists(name, function(err, exists) {
						if (!err && !exists) err = new Error(
							'Migration doesn`t exists'
						);
						if (err) handleError(err);
						migrator.loadMigration(name, function(err, migration) {
							if (err) handleError(err);
							migrator.execute(migration, function(err) {
								if (err) handleError(err);
								console.log('migration successfully done')
								// call next
								if (index < funcs.length - 1) funcs[++index]();
							});
						});
					});
				};
			});
			// starts migrations execution
			funcs[0]();
		}
	});


/**
 * Rollback
 */
program
	.command('rollback <migrations>')
	.description('rollback selected migrations')
	.action(function(names) {
		var migrator = new Migrator(program);
		rollback(null, names.split(','));
		function rollback(err, names) {
			if (err) handleError(err);
			console.log('Target migrations: ', names.join(' '));
			names.forEach(function(name) {
				//TODO: rollback migration (and do it sequentially)
				migrator.adapter.unmarkExecuted(name, function(err) {
					if (err) handleError(err);
					console.log('migration unmarked as executed');
				});
			});
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
		migrator.getMigrationNames(status, function(err, migrations) {
			if (err) handleError(err);
			migrations.forEach(function(migration) {
				console.log('\t', migration);
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
