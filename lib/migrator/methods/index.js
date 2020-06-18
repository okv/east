// Main API methods
exports.init = require('./init');
exports.configure = require('./configure');
exports.create = require('./create');
exports.remove = require('./remove');
exports.getMigrationNames = require('./getMigrationNames');
exports.filterMigrationNames = require('./filterMigrationNames');
exports.loadMigration = require('./loadMigration');
exports.validateMigration = require('./validateMigration');
exports.connect = require('./connect');
exports.disconnect = require('./disconnect');
exports.migrate = require('./migrate');
exports.rollback = require('./rollback');

// Other API methods
exports.getAllMigrationNames = require('./getAllMigrationNames');
exports.getNewMigrationNames = require('./getNewMigrationNames');
exports.isDirExists = require('./isDirExists');
exports.isMigrationExists = require('./isMigrationExists');
exports.checkMigrationsExists = require('./checkMigrationsExists');
exports.getMigrationPathByName = require('./getMigrationPathByName');
exports.getMigrationNameByPath = require('./getMigrationNameByPath');
exports.separateNames = require('./separateNames');
exports.normalizeNames = require('./normalizeNames');

// Adapter related internal methods
exports._createAdapter = require('./_createAdapter');
exports._promisifyAdapter = require('./_promisifyAdapter');

// Migration numbering related internal methods
exports._getNumber = require('./_getNumber');
exports._getBaseName = require('./_getBaseName');
exports._getDateTimeNumber = require('./_getDateTimeNumber');
exports._getSequentialNumber = require('./_getSequentialNumber');
exports._getNextNumber = require('./_getNextNumber');

// Plugin related internal methods
exports._promisifyPlugin = require('./_promisifyPlugin');
exports._registerPlugins = require('./_registerPlugins');
exports._createHooks = require('./_createHooks');

// Other internal methods
exports._executeAction = require('./_executeAction');
exports._resolveModulePath = require('./_resolveModulePath');
exports._loadModule = require('./_loadModule');
exports._loadConfig = require('./_loadConfig');
exports._filterMigrationNamesByTag = require('./_filterMigrationNamesByTag');
exports._getMigrationFileTypeParams = require('./_getMigrationFileTypeParams');
