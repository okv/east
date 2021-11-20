# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased][]

Everything is released for now.

## [2.0.3][] - 2021-11-20

### Changed
- dev: Travis CI replaced with GitHub actions
- dev: Coveralls dev dependency is removed (Coveralls GitHub Action is used
instead)
- dev: update some dev dependencies (lodash, hosted-git-info, glob-parent,
path-parse) to get rid of some vulnerabilities
- dev: add more test cases for config in different formats

### Fixed

- ES Modules format support for config file has been fixed

## [2.0.2][] - 2021-03-30

### Changed
- Update underscore to 1.12.1
- dev: update tap to 14.11.0
- dev: calculate code coverage with c8 (instead of tap and istanbul)
- dev: replace `makeCodeCoverageSummaryReport` and `makeCodeCoverageDetailReport`
package.json scripts with `coverage` script

### Fixed
- Minimum required Node.js version updated from 10.0.0 to 10.17.0 (it's a
minimum version for proper usage (without warnings about using `fs.promises`,
etc))

## [2.0.1][] - 2020-06-19

### Fixed
- Auto exit migration feature (completed migration will exit even if there are
some timers in nodejs event loop) which was accidentally broken in 2.0.0

## [2.0.0][] - 2020-06-18

### Added
- Support ES Modules for config, migrations, adapter and plugins via `--es-modules` flag
- Support for transpiled languages via `--source-dir`, `--source-migration-extension`,
`--migration-extension` (should also work with `ts-node`)
- TypeScript type declarations for all exposed entities (`Adapter` interface
and `MigrationManager` class)
- Builtin TypeScript migration template file

### Changed
- *Breaking change:* Default migration template now uses `async` functions
- *Breaking change:* `MigrationManager` `onSkipMigration` event reasons are
renamed: canNotMigrateAlreadyExecuted -> cannotMigrateAlreadyExecuted,
canNotRollbackNotExecuted -> cannotRollbackNotExecuted,
canNotMigrateAlreadyExecuted -> cannotMigrateAlreadyExecuted
- *Breaking change:* Output text messages changed - now quotes used in
consistent way (double quotes in most cases). This can only breaks if you parse
east text messages (errors, log messages, etc).
- Adapter/plugin path resolves by it's shape (earlier tried to load migrator
related path first then cwd related) to cwd related path, abs path or module
name - should behave same way as before for most cases
- `Adapter.getTemplatePath()` now gets passed the migration file extension so
now adapters may create multiple templates for different languages (e.g
separate tempalte for `js` and `ts`)
- `MigrationManager.isInitialized()` now additionally checks that the `sourceDir`
exists
- `MigrationManager.getMigrationPath()` now accepts a second optional parameter
`migrationFileType` to let take apart `source` and `executable` files.
- cli arguments parsing rewrite using updated commander 5.1, in most cases
cli behaves same way as before
- bin/east renamed to bin/east.js but exposed as earlier - east
- dev: drop p-each-series dependency (replaced with p-map)
- dev: drop pify dependency (replaced with util.promisify)
- dev: drop fs extra dependency (replaced with builtin fs module and pathExists
helper)
- dev: update dependencies (p-map -> 4.0.0, p-props -> 4.0.0,
p-timeout -> 3.2.0)
- dev: update dev dependencies (eslint -> 6.8.0,
eslint-config-airbnb-base -> 14.1.0, eslint-plugin-import -> 2.20.2,
remark-lint-maximum-line-length -> 2.0.0,
coveralls -> 3.1.0, remark -> 12.0.0, remark-cli -> 8.0.0,
remark-preset-lint-consistent -> 3.0.0, remark-preset-lint-recommended -> 4.0.0,
ts-node -> 8.9.1)

### Removed
- Comma separated target migrations support
- Migration `createBar` helper, use
[migration progress indicator helper](https://github.com/okv/east-migration-progress-indicator-helper)
instead
- Callback migrator interface support
- Nodejs 4, 6, 8 support, node.js >= 10 is required

## [1.3.0][] - 2019-12-10

### Added
- `MigrationManager` class is exposed for library usage

### Changed
- dev: update tap to 12.7.0

## [1.2.0][] - 2019-09-09

### Added
- Plugins API introduced
- Links to migration duration plugin, progress indicator plugin added to readme
- dev: integration testing for cli program added
- dev: code coverage reporting added

### Changed
- dev: mocha test runner replaced with tap
- dev: migrator module turned to many nested modules
- dev: test file turned to many test files
- dev: node.js versions in CI configuration updated
- dev: eslint, underscore, progress, commander dependencies updated

## [1.1.1][] - 2019-09-08

### Changed
- Add eslint and eastrc file to npmignore, publish npm package without ignored
files

### Fixed
- Promisify adapter when constructor is provided

## [1.1.0][] - 2019-07-26

### Added
- Allow creation of migration files with timestamp-derived prefixes

## [1.0.2][] - 2019-09-08

### Changed
- Add eslint and eastrc file to npmignore, publish npm package without ignored
files

## [1.0.1][] - 2019-07-22

### Changed
- dev: eslint updated to 4.18.2

### Fixed
- Fixed undefined instead of migrations dir at bin init command logging

## [1.0.0][] - 2018-04-25

### Added
- Async configuration support added (config can export function with callback
or function which returns promise)

### Changed
- dev: jshint source code linter replaced with eslint
- dev: source code updated to use es 6 syntax
- dev: promises used for control flow instead of callbacks
- dev: part of local utils replaced by underscore

### Removed
- dropped node.js 0.10 support, node.js >= 4 is required

[Unreleased]: https://github.com/okv/east/compare/v2.0.3...HEAD
[2.0.3]: https://github.com/okv/east/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/okv/east/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/okv/east/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/okv/east/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/okv/east/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/okv/east/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/okv/east/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/okv/east/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/okv/east/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/okv/east/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/okv/east/compare/v0.5.7...v1.0.0
