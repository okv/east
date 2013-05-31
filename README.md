# east

east - node.js database migration tool for different databases (extensible via
adapters)

## Installation

```
npm install east -g
```

alternatively you could install it locally

## Usage

go to project dir and run

```
east init
```

after that you can `create`, `migrate`, `rollback` your migrations.

Run `east -h` to see all commands:

```

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


```

run `east <command> -h` to see detail command help.

All options described above can be set via command line or at `.eastrc` file
located at current directory, e.g.:

```js

{
	"dir": "./dbmigration",
	"template": "./lib/node/utils/migrationTemplate.js"
}

```


## Running test

into cloned repository run

```
npm test
```

