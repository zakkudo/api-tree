import ValidationError from './ValidationError';
import Validator from 'ajv';
import fetch from '@zakkudo/fetch';
import {fromJS} from 'immutable';

const validator = new Validator();

/**
 * @private
 */
function compile(schema) {
    const compiled = ['params', 'body'].reduce((accumulator, k) => {
        if (schema[k]) {
            return Object.assign({}, accumulator, {
                [k]: validator.compile(schema[k])
            });
        }

        return accumulator;
    }, {});

    /**
     * @private
     */
    return function validate(options) {
        const keys = Object.keys(compiled);

        return keys.reduce((accumulator, k) => {
            const errors = compiled[k](options[k] || {})

            if (compiled[k].errors && compiled[k].errors.length) {
                return Object.assign({}, accumulator || {}, {[k]: compiled[k].errors});
            }
        }, null);
    }
}



/**
 * Generates a function that calls fetch with predefined
 * default options to a selected url.
 * @param {Object} self - The root of the tree
 * @param {Array} args - The arguments that will be passed to fetch mostly as-is
 * @param {String} args.url - The url to access
 * @param {Object} args.options - An options object similar to what would be passed to fetch
 * @return {Function} A function with callable options to do an api call
 * @private
 */
function generateFetchMethod(self, [pathname, endpointOptions, schema = {}]) {
    const validate = compile(schema);

    return (overrideOptions = {}) => {
        const baseOptions = self.options.toJS();
        const options = Object.assign(
            baseOptions,
            endpointOptions,
            overrideOptions
        );
        const url = `${self.baseUrl}${pathname}`;
        const errorsByKey = validate(options);

        if (errorsByKey) {
            return Promise.reject(new ValidationError(errorsByKey));
        }

        return fetch(url, options);
    };
}

/**
 * Parses configuration data into a usable api tree. The api tree
 * has convenience methods for doing pre-defined api actions.
 * @param {Object} self - The root of the tree
 * @param {Object} data - The api configuration
 * @return {Object} The parsed api tree
 * @private
 */
function parse(self, data) {
    // Assume is fetch configuration definition
    if (Array.isArray(data)) {
        return generateFetchMethod(self, data);
        // If it's a function, bind ot the base object for convenience functions
    } else if (typeof data === 'function') {
        return data.bind(self);
        // Otherwise we pass through
    } else if (Object(data) === data) {
        return Object.keys(data).reduce((accumulator, k) => {
            return Object.assign(accumulator, {
                [k]: parse(self, data[k]),
            });
        }, {});
        // Assume this is deeper in the tree
    } else {
        return data;
    }
}

/**
 * Helper class to make working with api collections enjoyable. Generate an
 * easy to use api tree that includes format checking using
 * [JSON Schema]{@link http://json-schema.org/} for the body and params
 * with only a single configuration object. Network calls are executed using
 * a thin convenience wrapper around [fetch]{@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch}.
 *
 * Why use this?
 *
 * - Consistancy with simplicity
 * - Leverages native fetch, adding a thin convenience layer.
 * - Use json schemas to ensure correct usage of the apis
 * - Share authorization handling using a single location that can be updated dynamically
 * - Share a single transform for the responses and request in a location that can be updated dynamically
 *
 * Install with:
 *
 * ```console
 * yarn add @zakkudo/api-tree
 * ```
 *
 * @example
 * import ApiTree from '@zakkudo/api-tree';
 *
 * const api = new ApiTree('https://backend', {
 *     users: {
 *         query: ['/v1/users'],
 *         post: ['/v1/users', {method: 'POST'}, {
 *              body: {
 *                  type: 'object',
 *                  required: ['first_name', 'last_name'],
 *                  properties: {
 *                       first_name: {
 *                           type: 'string'
 *                       },
 *                       last_name: {
 *                           type: 'string'
 *                       },
 *                  },
 *              }
 *         }],
 *         get: ['/v2/users/:userId', {}, {
 *              params: {
 *                  type: 'object',
 *                  required: ['userId'],
 *                  properties: {
 *                       userId: {
 *                           type: 'string',
 *                           pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
 *                       },
 *                  },
 *              }
 *         }]
 *     }
 * }, {
 *     headers: {
 *          'X-AUTH-TOKEN': '1234'
 *     }
 * });
 *
 * //Set headers after the fact
 * api.options.headers['X-AUTH-TOKEN'] = '5678';
 *
 * // Try using a valid id
 * api.get({params: {userId: 'ff599c67-1cac-4167-927e-49c02c93625f'}}).then((user) => {
 *      console.log(user); // {id: 'ff599c67-1cac-4167-927e-49c02c93625f', first_name: 'john', last_name: 'doe'}
 * })
 *
 * // Try fetching without an id
 * api.get().catch((reason) => {
 *      console.log(reason); // "params: should have required property 'userId'
 * })
 *
 * // Try using an invalidly formatted id
 * api.get({params: {userId: 'invalid format'}}).catch((reason) => {
 *      console.log(reason); // "params.userId: should match pattern \"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\""
 * });
 *
 * @module ApiTree
 */
export default class ApiTree {
    /**
     * @param {String} baseUrl - The url to prefix with all paths
     * @param {*} tree - The configuration tree for the apis. Accepts a
     * deeply nested set of objects where array are interpreted to be of the form `[path, options, schema]`. Thos array are converted into
     * api fetching functions.
     * @param {Object} options - Options that will be the default base init for fetch operations. The same as those used for `@zakkudo/fetch`
     * @return {Object} The generated api tree
    */
    constructor(baseUrl, tree, options = {}) {
        this.baseUrl = baseUrl || '';
        this.options = fromJS(options);
        Object.assign(this, parse(this, tree));
    }
}
