'use strict';

module.exports = (number, padding) => {
	let paddedNumber = number.toString();
	while (paddedNumber.length < padding) {
		paddedNumber = `0${paddedNumber}`;
	}
	return paddedNumber;
};
