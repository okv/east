const {Hook} = require('mhook');

module.exports = function _createHooks() {
	const hooks = new Hook([
		'beforeMigrate',
		'afterMigrate',
		'migrateError',
		'beforeRollback',
		'afterRollback',
		'rollbackError'
	]);

	const originalHooksOn = hooks.on;

	// monkey patch `on` to allow sync result by returning promise, without
	// that mhook will hang on sync hook since in general case it doesn't know
	// how many args to decide is it required to wait for callback (in our
	// case all hooks accept single parameter)
	hooks.on = function hooksOn(action, hook) {
		const newHook = (params) => {
			const result = hook.call(null, params);

			if (hook.length > 1 || result instanceof Promise) {
				return result;
			} else {
				return Promise.resolve();
			}
		};

		return originalHooksOn.call(this, action, newHook);
	};

	return hooks;
};
