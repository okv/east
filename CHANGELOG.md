# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2019-09-09
### Added
- Plugins API introduced
- Links to migration duration plugin, progress indicator plugin added to readme
- dev: integration testing for cli program added
- dev: code coverage reporting added

### Changed
- dev change: mocha test runner replaced with tap
- dev change: migrator module turned to many nested modules
- dev change: test file turned to many test files
- dev change: node.js versions in CI configuration updated
- dev change: eslint, underscore, progress, commander dependencies updated

## [1.1.1] - 2019-09-08
### Fixed
- Promisify adapter when constructor is provided

## [1.1.0] - 2019-07-26
### Added
- Allow creation of migration files with timestamp-derived prefixes

## [1.0.2] - 2019-09-08
### Changed
- Add eslint and eastrc file to npmignore, publish npm package without ignored
files

## [1.0.1] - 2019-07-22
### Fixed
- Fixed undefined instead of migrations dir at bin init command logging

### Changed
- dev change: eslint updated to 4.18.2

## [1.0.0] - 2018-04-25
### Added
- Async configuration support added (config can export function with callback
or function which returns promise)

### Changed
- dev change: jshint source code linter replaced with eslint
- dev change: source code updated to use es 6 syntax
- dev change: promises used for control flow instead of callbacks
- dev change: part of local utils replaced by underscore
