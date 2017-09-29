'use strict';

[
	'Function', 'AsyncFunction', 'String', 'Number', 'Date', 'RegExp'
].forEach(function(name) {
	exports['is' + name] = function(obj) {
		return toString.call(obj) == '[object ' + name + ']';
	};
});

exports.isObject = function(obj) {
	return obj === Object(obj);
};

exports.isArray = Array.isArray;

exports.noop = function() {};

exports.slice = function() {
	var array = Array.prototype.shift.call(arguments);
	return Array.prototype.slice.apply(array, arguments);
};

function extend(dst, src) {
	for (var key in src) {dst[key] = src[key];}
	return dst;
}

exports.extend = extend;

exports.keys = Object.keys;

// operators for expressionify lib
exports.booleanOperators = {
	'|': {
		execute: function(x, y) { return x || y; },
		priority: 1,
		type: 'binary'
	},
	'&': {
		execute: function(x, y) { return x && y; },
		priority: 2,
		type: 'binary'
	},
	'!': {
		execute: function(x) { return !x; },
		priority: 3,
		type: 'unary'
	}
};

function assign() {
	var dest = {};

	do {
		var src = arguments.shift();
		extend(dest, src);
	} while(arguments.length > 0);

	return dest;
};

exports.assign = (Object.assign === undefined ? assign : Object.assign);
