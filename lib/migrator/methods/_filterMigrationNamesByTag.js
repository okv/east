const _ = require('underscore');
const expressionify = require('expressionify');
const pMap = require('p-map');

const operators = {
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

module.exports = function _filterMigrationNamesByTag(params) {
	return Promise.resolve()
		.then(() => {
			return pMap(params.names, (name) => {
				return this.loadMigration(name);
			}, {concurrency: 10});
		})
		.then((migrations) => {
			const names = [];

			const evalTagExpression = expressionify(params.tag, {operators});

			migrations.forEach((migration) => {
				const expressionResult = evalTagExpression({
					parseOperand: (operand) => {
						return (
							migration.tags &&
							_(migration.tags).contains(operand)
						);
					}
				});

				if (expressionResult) {
					names.push(migration.name);
				}
			});

			return {names};
		});
};
