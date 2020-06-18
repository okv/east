#!/usr/bin/env node

const _ = require('underscore');
const {program} = require('commander');
const InitAction = require('./actions/init');
const CreateAction = require('./actions/create');
const MigrateAction = require('./actions/migrate');
const RollbackAction = require('./actions/rollback');
const ListAction = require('./actions/list');
const DefaultAction = require('./actions/default');

program
	.version(require('../package.json').version)
	.option('--adapter <name>', 'which db adapter to use')
	.option('--config <path>', 'config file to use')
	.option('--timeout <timeout>', 'timeout for migrate/rollback')
	.option('--template <path>', 'path to template for new migrations')
	.option(
		'--dir <dir>',
		'dir where migration executable files are stored (default: "./migrations")'
	)
	.option(
		'--source-dir <dir>',
		'dir where migration source files are stored, equal to --dir by default'
	)
	.option(
		'--migration-extension <ext>',
		'migration executable files extension name (default: "js")'
	)
	.option(
		'--source-migration-extension <ext>',
		'migration source files extension name, ' +
		'equal to --migration-extension by default'
	)
	.option('--url <url>', 'db connect url')
	.option('--trace', 'verbose mode (includes error stack trace)')
	.option('--silent', 'prevent output of detailed log')
	.option('--es-modules', 'turn on ES modules support')
	.option(
		'--no-exit',
		'require a clean shutdown of the event loop: process.exit will not be ' +
		'called at the end'
	);

program
	.command('init')
	.description('initialize migration system')
	.action(() => {
		const action = new InitAction({opts: program.opts()});
		return Promise.resolve()
			.then(() => action.init({skipDirCheck: true}))
			.then(() => action.execute())
			.catch((err) => action.onError(err));
	});

program.command('create <basename>')
	.description('create new migration based on template')
	.action((basename) => {
		const action = new CreateAction({opts: program.opts()});
		return Promise.resolve()
			.then(() => action.init())
			.then(() => action.execute({basename}))
			.catch((err) => action.onError(err));
	});

program
	.command('migrate [migrations...]')
	.option(
		'-s, --status <name>', 'which migrations execute by default (when ' +
		'particular migrations are not set), default status is "new"'
	)
	.option('-f, --force', 'force to execute already executed migrations')
	.option(
		'-t, --tag <expression>', 'execute only migrations that satisfied expression'
	)
	.description('run all or selected migrations')
	.action((names, command) => {
		const action = new MigrateAction({opts: program.opts()});
		const executeParams = _(command).pick('status', 'tag', 'force');
		_(executeParams).extend({names});

		return Promise.resolve()
			.then(() => action.init())
			.then(() => action.execute(executeParams))
			.catch((err) => action.onError(err));
	});

program
	.command('rollback [migrations...]')
	.option(
		'-s, --status <name>', 'which migrations execute by default (when ' +
		'particular migrations are not set), default status is "executed"'
	)
	.option('-f, --force', 'force to rollback not yet executed migrations')
	.option(
		'-t, --tag <expression>', 'rollback only migrations that satisfied expression'
	)
	.description('rollback all or selected migrations')
	.action((names, command) => {
		const action = new RollbackAction({opts: program.opts()});
		const executeParams = _(command).pick('status', 'tag', 'force');
		_(executeParams).extend({names});

		return Promise.resolve()
			.then(() => action.init())
			.then(() => action.execute(executeParams))
			.catch((err) => action.onError(err));
	});

program
	.command('list [status]')
	.option(
		'-t, --tag <expression>', 'list only migrations that satisfied expression'
	)
	.description(
		'list migration with selected status ("new", "executed" or "all"), ' +
		'"new" by default'
	)
	.action((status = 'new', command) => {
		const action = new ListAction({opts: program.opts()});
		return Promise.resolve()
			.then(() => action.init())
			.then(() => action.execute({tag: command.tag, status}))
			.catch((err) => action.onError(err));
	});

program
	.command('*')
	.action((command) => {
		const action = new DefaultAction({opts: program.opts()});
		return Promise.resolve()
			.then(() => action.execute({command}))
			.catch((err) => action.onError(err));
	});


// let's start the party (program entry point)
program.parseAsync(process.argv)
	.catch((err) => {
		// eslint-disable-next-line no-console
		console.error('Error occurred: ', err.stack || err);
	});
