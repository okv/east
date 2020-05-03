const _ = require('underscore');
const expressionify = require('expressionify');
const pMap = require('p-map');
const utils = require('../../utils');

module.exports = function _filterMigrationNamesByTag(params) {
	return Promise.resolve()
		.then(() => {
			return pMap(params.names, (name) => {
				return this.loadMigration(name);
			}, {concurrency: 10});
		})
		.then((migrations) => {
			const names = [];

			const evalTagExpression = expressionify(params.tag, {
				operators: utils.booleanOperators
			});

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
