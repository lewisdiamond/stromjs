const es6Promisify = require('es6-promisify');

/**
 * Return a promise that resolves once the given event emitter emits the specified event
 *
 * @param {NodeJS.EventEmitter} emitter - The event emitter to watch
 * @param {string} event - The event to watch
 * @returns {Promise<{}>} - The promise that resolves once the given emitter emits the specified evnet
 */
export function once(emitter: NodeJS.EventEmitter, event: string) {
  return new Promise((resolve) => {
    emitter.once(event, result => {
      resolve(result);
    });
  });
}

/**
 * Transform callback-based function -- func(arg1, arg2 .. argN, callback) -- into
 * an ES6-compatible Promise. Promisify provides a default callback of the form (error, result)
 * and rejects when `error` is truthy. You can also supply settings object as the second argument.
 *
 * @param {function} original - The function to promisify
 * @param {object} [settings] - Settings object
 * @param {object} settings.thisArg - A `this` context to use. If not set, assume `settings` _is_ `thisArg`
 * @param {bool} settings.multiArgs - Should multiple arguments be returned as an array?
 * @returns {function} A promisified version of `original`
 */
export function promisify(original: Function, settings?: Object): Function {
  return es6Promisify(original, settings);
};
