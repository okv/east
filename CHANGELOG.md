# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
