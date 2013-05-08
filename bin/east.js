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
	.description('run all or selected migrations')
	.action(function(names) {
		var migrator = new Migrator(program);
		if (!names) {
			migrator.getNewMigrationNames(migrate);
		} else {
			migrate(null, names.split(','));
		}
		function migrate(err, names) {
			if (err) handleError(err);
			console.log('Target migrations: ', names.join(' '));
			names.forEach(function(name) {
				//TODO: execute migration (and do it sequentially)
				migrator.isMigrationExists(name, function(err, exists) {
					if (!err && !exists) err = new Error(
						'Migration doesn`t exists'
					);
					if (err) handleError(err);
					migrator.adapter.markExecuted(name, function(err) {
						if (err) handleError(err);
						console.log('migration marked as executed');
					});
				});
			});
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
// show help if no one command is selected
if (!program.args.length) program.help();
