'use strict';

['Function', 'String', 'Number', 'Date', 'RegExp'].forEach(function(name) {
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

// Parses parameters from `args` passed to the `action` callback of `command`
exports.parseCommandParams = function(args) {
	var result = {items: [], command: {}};
	for (var key in args) {
		if (exports.isString(args[key])) {
			result.items.push(args[key]);
		} else {
			if (exports.isObject(args[key])) result.command = args[key];
			break;
		}
	}
	return result;
};

exports.extend = function(dst, src) {
	for (var key in src) {dst[key] = src[key];}
	return dst;
};

exports.keys = Object.keys;
