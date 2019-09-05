'use strict';

const nameRegExpStr = '^([0-9]+)_(.*)';

exports._nameRegExp = new RegExp(nameRegExpStr);

exports._fileNameRegExp = new RegExp(`${nameRegExpStr}\\.js$`);
