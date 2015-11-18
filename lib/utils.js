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

exports.extend = function(dst, src) {
	for (var key in src) {dst[key] = src[key];}
	return dst;
};

exports.keys = Object.keys;
