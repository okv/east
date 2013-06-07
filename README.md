# east

east - node.js database migration tool for different databases (extensible via
[adapters](#adapters))

## Installation

```sh
npm install east -g
```

alternatively you could install it locally

## Usage

go to project dir and run

```sh
east init
```

after that you can `create`, `migrate`, `rollback` your migrations.

Run `east -h` to see all commands:

```sh

  Usage: east [options] [command]

  Commands:

    init                   initialize migration system
    create <basename>      create new migration based on template
    migrate [options] [migrations] run all or selected migrations
    rollback [migrations]  rollback all or selected migrations
    list [status]          list migration with selected status (`new`, `executed` or `all`), `new` by default
    *                     

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    --adapter <name>     which db adapter to use
    --config <path>      config file to use
    --timeout <timeout>  timeout for migrate/rollback
    --template <path>    path to template for new migrations
    --dir <dir>          dir where migrations stored
    --url <url>          db connect url
    --trace              if error occured stack trace will be shown

```

run `east <command> -h` to see detail command help.

All options described above can be set via command line or at `.eastrc` file
located at current directory, e.g.:

```js

{
	"dir": "./dbmigration",
	"template": "./lib/node/utils/customMigrationTemplate.js"
}

```

### create

```sh
east create doSomething
```

produces something like this

```sh
New migration `1_doSomething` created at migrations/1_doSomething.js
```

created file will contain

```js
exports.migrate = function(client, done) {
    done();
};

exports.rollback = function(client, done) {
    done();
};
```

`client` is connect to current db and he determined by adapter (see [adapters](#adapters) section)  
`done` is function which should be called at the end of migration (if any
error occured you can pass it as first argument)  
migration also can be synchronous - declare only client at `migrate` or `rollback`  
`rollback` function is optional and may be omitted  

Migration file is normal node.js module and you can migrate any database e.g.

```js
// include your database wrapper which you already use in app
var db = require('./db');

exports.migrate = function(client, done) {
    db.connect(function(err) {
        if (err) done(err);
        db.things.insert({_id: 1, name: 'apple', color: 'red'}, done);
    });
};

exports.rollback = function(client, done) {
    db.connect(function(err) {
        if (err) done(err);
        db.things.remove({_id: 1}, done);
    });
};

```

or you can use special adapter for database (see [adapters](#adapters) section)

### migrate

let's create one more migration

```sh
east create doSomethingElse
```

then executes both of them

```sh
east migrate
```

it sequentially executes all new migrations and produces

```sh
target migrations:
    1_doSomething
    2_doSomethingElse
migrate `1_doSomething`
migration done
migrate `2_doSomethingElse`
migration done
```

selected migrations can be executed by passing their names (or numbers or
basenames or paths) as argument

```sh
east migrate 1_doSomething,2_doSomethingElse
```

in our case this command will skip all of them

```sh
skip `1_doSomething` because it`s already executed
skip `2_doSomethingElse` because it`s already executed
nothing to migrate
```

you can pass `--force` option to execute already executed migrations.  
This is useful while you develop and test your migration.

### rollback

`rollback` has similar to `migrate` command syntax but executes `rollback`
function from migration file

```sh
east rollback
```

will produce

```sh
target migrations:
    2_doSomethingElse
    1_doSomething
rollback `2_doSomethingElse`
migration successfully rolled back
rollback `1_doSomething`
migration successfully rolled back
```

### list

```sh
east list
```

shows new migration e.g.

```sh
new migrations:
     1_doSomething
     2_doSomethingElse
```

target status could be specified as an argument e.g.

```sh
east list executed
```


## Adapters

adapter determines where executed migration names will be stored and what will be
passed to `migrate` and `rollback` function as `client`.
Default adapter store executed migration names at file `.migrations` which is
located at migrations directory and pass `null` as `client`.

Other adapters:
* [mongodb](https://github.com/okv/east-mongo)


## Running test

into cloned repository run

```sh
npm test
```

