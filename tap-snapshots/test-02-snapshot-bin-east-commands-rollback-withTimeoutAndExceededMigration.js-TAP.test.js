/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/02-snapshot/bin/east/commands/rollback/withTimeoutAndExceededMigration.js TAP > output 1`] = `
Target migrations:
	1_someMigrationName
Rollback "1_someMigrationName"

Error: Error during rollback "1_someMigrationName": Migration execution timeout exceeded (100 ms)
[East source stack trace]

`
