'use strict';

const util = require('util');
const {exec} = require('child_process');

module.exports = util.promisify(exec);
