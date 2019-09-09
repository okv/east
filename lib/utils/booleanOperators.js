'use strict';

// operators for expressionify lib
module.exports = {
	'|': {
		execute: (x, y) => x || y,
		priority: 1,
		type: 'binary'
	},
	'&': {
		execute: (x, y) => x && y,
		priority: 2,
		type: 'binary'
	},
	'!': {
		execute: (x) => !x,
		priority: 3,
		type: 'unary'
	}
};
