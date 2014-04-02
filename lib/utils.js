'use strict';

['Function', 'String', 'Number', 'Date', 'RegExp'].forEach(function(name) {
	exports['is' + name] = function(obj) {
		return toString.call(obj) == '[object ' + name + ']';
	};
});

exports.isObject = function(obj) {
	return obj === Object(obj);
};

exports.noop = function() {};

exports.slice = Array.prototype.slice;

// parses `args` passed to the `action` callback of `command`
exports.parseCommandArgs = function(args) {
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
