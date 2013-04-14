#!/usr/bin/env node

var program = require('commander'),
	Path = require('path'),
	fs = require('fs'),
	DefaultAdapter = require('../lib/adapter');

program
  .version('0.1.0')
  .usage('[options] <migration1 ...>')
  .option('-m, --migrate', 'execute migrations')
  .option('-r, --rollback', 'rollback migrations')
  .option('-c, --create <name>', 'create migration template')
  .option('--config <path>', 'config file to use')
  .option('--adapter <name>', 'which db adapter to use')
  .option('--dir <dir>', 'dir where migrations stored')
  .option('-ls, --list', 'list migrations')
  .parse(process.argv);

var cwd = process.cwd();
var configPath = program.config || Path.join(cwd, '.eastrc');

var dir = Path.join(cwd, 'migrations'),
	adapter = program.adapter || new DefaultAdapter();

// create new migration base on template
if (program.create) {
	var baseName = program.create,
		path = getMigrationPath(Date.now() + '_' + baseName),
		templatePath = adapter.getTemplatePath();
	fs.createReadStream(templatePath).pipe(
		fs.createWriteStream(path)
	);
	console.log('New migration created: ', path);
} else if (program.list) {
	console.log('migrations:');
	getMigrations(function(err, migrations) {
		if (err) handleError(err);
		migrations.forEach(function(migration) {
			console.log('\t', migration);
		});
	});
} else {
	program.help();
}

function getMigrations(callback) {
	fs.readdir(dir, function(err, paths) {
		if (err) {
			callback(err);
			return;
		}
		callback(null, paths.map(getMigrationName));
	});
}

//get migration path by name
function getMigrationPath(name) {
	return Path.join(dir, name + '.js');
}

//get migration name by path
function getMigrationName(path) {
	return Path.basename(path, '.js');
}

function handleError(err) {
	throw err;
}
