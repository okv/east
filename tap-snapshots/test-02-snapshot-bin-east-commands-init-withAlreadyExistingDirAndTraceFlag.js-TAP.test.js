/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/02-snapshot/bin/east/commands/init/withAlreadyExistingDirAndTraceFlag.js TAP > output 1`] = `
Current parameters: {
    "dir": "[Migrations dir]",
    "migrationExtension": "js",
    "sourceDir": "[Migrations dir]",
    "sourceMigrationExtension": "js",
    "timeout": 604800000,
    "adapter": "[Adapter path]",
    "url": null,
    "migrationNumberFormat": "sequentialNumber",
    "trace": true,
    "loadConfig": true,
    "template": "[Migration template]"
}

Error: Migration directory "[Migrations dir]" already exists
[East source stack trace]

`
