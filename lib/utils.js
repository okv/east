'use strict';

[
	'Function', 'AsyncFunction', 'String', 'Number', 'Date', 'RegExp'
].forEach((name) => {
	exports[`is${name}`] = function (obj) {
		return toString.call(obj) == `[object ${name}]`;
	};
});

exports.isObject = function (obj) {
	return obj === Object(obj);
};

exports.isArray = Array.isArray;

exports.noop = function () {};

exports.slice = function () {
	const array = Array.prototype.shift.call(arguments);
	return Array.prototype.slice.apply(array, arguments);
};

exports.extend = function (dst, src) {
	for (const key in src) {
		dst[key] = src[key];
	}

	return dst;
};

exports.pick = function (object, keys) {
	const newObject = {};

	keys.forEach((key) => {
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
