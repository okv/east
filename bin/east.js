#!/usr/bin/env node

var program = require('commander'),
	Path = require('path'),
	fs = require('fs'),
	DefaultAdapter = require('../lib/adapter');


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
		var app = new App(program),
			path = app.getMigrationPathByName(Date.now() + '_' + basename),
			templatePath = app.adapter.getTemplatePath();
		fs.createReadStream(templatePath).pipe(fs.createWriteStream(path));
		console.log('New migration created: ', path);
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
		var app = new App(program),
			status = command.status || 'new';
		console.log(status + ' migrations:');
		app.getMigrationNames(status, function(err, migrations) {
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
 * Main class
 */
function App(program) {
	var cwd = process.cwd();
	this.configPath = program.config || Path.join(cwd, '.eastrc'),
	this.migrationsDir = program.dir || Path.join(cwd, 'migrations'),
	this.adapter = program.adapter || new DefaultAdapter({
		migrationsDir: this.migrationsDir
	});
}

App.prototype.getAllMigrationNames = function(callback) {
	var self = this;
	fs.readdir(this.migrationsDir, function(err, paths) {
		if (err) { callback(err); return; }
		var names = paths
			.sort()
			.map(self.getMigrationNameByPath)
			//skip hidden files
			.filter(function(name) {
				return /^\./.test(name) === false;
			});
		callback(null, names);
	});
};

App.prototype.getNewMigrationNames = function(callback) {
	function findNewNames(allNames, executedNames) {
		var executedNamesHash = {};
		executedNames.forEach(function(name) { executedNamesHash[name] = 1; });
		var newNames = allNames.filter(function(name) {
			return (name in executedNamesHash === false);
		});
		callback(null, newNames);
	}
	var self = this;
	self.getAllMigrationNames(function(err, allNames) {
		if (err) { callback(err); return; }
		self.adapter.getExecutedMigrationNames(function(err, executedNames) {
			if (err) { callback(err); return; }
			findNewNames(allNames, executedNames);
		});
	})
};

App.prototype.getMigrationPathByName = function(name) {
	return Path.join(this.migrationsDir, name + '.js');
};

App.prototype.getMigrationNameByPath = function(path) {
	return Path.basename(path, '.js');
};

App.prototype.getMigrationNames = function(status, callback) {
	if (status == 'all') {
		this.getAllMigrationNames(callback);
	} else if (status == 'executed') {
		this.adapter.getExecutedMigrationNames(callback);
	} else if (status == 'new') {
		this.getNewMigrationNames(callback);
	} else {
		callback(new Error('Unrecognized status `' + status + '`'))
	}
}


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
