'use strict';

[
	'Function', 'AsyncFunction', 'String', 'Number', 'Date', 'RegExp'
].forEach((name) => {
	exports[`is${name}`] = (obj) => {
		return toString.call(obj) === `[object ${name}]`;
	};
});

exports.isObject = (obj) => {
	return obj === Object(obj);
};

exports.isArray = Array.isArray;

exports.noop = () => {};

exports.slice = function slice() {
	const array = Array.prototype.shift.call(arguments);
	return Array.prototype.slice.apply(array, arguments);
};

exports.extend = (dst, src) => {
	// eslint-disable-next-line guard-for-in, no-restricted-syntax
	for (const key in src) {
		dst[key] = src[key];
	}

	return dst;
};

exports.pick = (object, keys) => {
	const newObject = {};

	keys.forEach((key) => {
		// eslint-disable-next-line no-prototype-builtins
		if (object.hasOwnProperty(key)) {
			newObject[key] = object[key];
		}
	});

	return newObject;
};

exports.keys = Object.keys;

// operators for expressionify lib
exports.booleanOperators = {
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
