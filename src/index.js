/**
 * @module @zakkudo/api-tree
 */

import ValidationError from './ValidationError';
import Validator from 'ajv';
import fetch from '@zakkudo/fetch';
import {fromJS} from 'immutable';

const validator = new Validator({
    logger: false,
    unknownFormats: "ignore",
});

/**
 * @private
 */
function getTemplateVariables(pathname) {
    const matches = pathname.match(/\/:[^/]+/g) || [];

    return matches.map((p) => p.slice(2));
}

/**
 * @private
 */
function getMatchingOverload(overloads, baseOptions, overrideOptions) {
    let matchCount = -1;
    let matchIndex = 0;
    const overrideParams = overrideOptions.params || {};

    overloads.forEach((o, index) => {
        const [pathname, options = {}] = o;
        const variables = getTemplateVariables(pathname);
        const params = Object.assign(
            {},
            baseOptions.params || {}, options.params || {},
            overrideParams
        );

        const count = variables.reduce((accumulator, v) => {

            if (params.hasOwnProperty(v)) {
                return accumulator + 1;
            }

            return accumulator - 1;
        }, 0);

        if (count > matchCount) {
            matchCount = count;
            matchIndex = index;
        }
    });

    return matchIndex
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
function generateFetchMethod(self, config) {
    if (isOverloaded(config)) {
        const compiled = config.map((c) => {
            const schema = c[2] || {};

            return validator.compile(schema);
        });

        return (overrideOptions = {}, validate = true) => {
            const baseOptions = self.options.toJS();
            const index = getMatchingOverload(config, baseOptions, overrideOptions);
            const overload = config[index];
            const [pathname, endpointOptions, schema = {}] = overload;
            const options = Object.assign(
                {},
                baseOptions,
                endpointOptions,
                overrideOptions
            );
            const url = `${self.baseUrl}${pathname}`;

            delete compiled[index].errors;

            if (validate) {
                compiled[index](options);
            }

            const errors = compiled[index].errors;

            if (errors) {
                return Promise.reject(new ValidationError(url, errors, schema));
            }

            return fetch(url, options);
        };
    } else {
        const [pathname, endpointOptions, schema = {}] = config;
        const compiled = validator.compile(schema);


        return (overrideOptions = {}, validate = true) => {
            const baseOptions = self.options.toJS();
            const options = Object.assign(
                baseOptions,
                endpointOptions,
                overrideOptions
            );
            const url = `${self.baseUrl}${pathname}`;

            delete compiled.errors;

            if (validate) {
                compiled(options);
            }
            const errors = compiled.errors;

            if (errors) {
                return Promise.reject(new ValidationError(url, errors, schema));
            }

            return fetch(url, options);
        };
    }
}

/**
 * @private
 */
function isOverloaded(data) {
    return Array.isArray(data) && Array.isArray(data[0]);
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

class ApiTree {
    /**
     * @param {String} baseUrl - The url to prefix with all paths
     * @param {*} tree - The configuration tree for the apis. Accepts a
     * deeply nested set of objects where array are interpreted to be of the form `[path, options, schema]`. Thos array are converted into
     * api fetching functions.
     * @param {Object} options - Options modifying the network call, mostly analogous to fetch
     * @param {String} [options.method='GET'] - GET, POST, PUT, DELETE, etc.
     * @param {String} [options.mode='same-origin'] - no-cors, cors, same-origin
     * @param {String} [options.cache='default'] - default, no-cache, reload, force-cache, only-if-cached
     * @param {String} [options.credentials='omit'] - include, same-origin, omit
     * @param {String} options.headers - "application/json; charset=utf-8".
     * @param {String} [options.redirect='follow'] - manual, follow, error
     * @param {String} [options.referrer='client'] - no-referrer, client
     * @param {String|Object} [options.body] - `JSON.stringify` is automatically run for non-string types
     * @param {String|Object} [options.params] - Query params to be appended to
     * the url. The url must not already have params.  The serialization uses the
     * same rules as used by `@zakkudo/query-string`
     * @param {Function|Array<Function>} [options.transformRequest] - Transforms for the request body.
     * When not supplied, it by default json serializes the contents if not a simple string. Also accepts
     * promises as return values for asynchronous work.
     * @param {Function|Array<Function>} [options.transformResponse] - Transform the response.  Also accepts
     * promises as return values for asynchronous work.
     * @param {Function|Array<Function>} [options.transformError] - Transform the
     * error response. Return the error to keep the error state.  Return a non
     * `Error` to recover from the error in the promise chain.  A good place to place a login
     * handler when recieving a `401` from a backend endpoint or redirect to another page.
     * It's preferable to never throw an error here which will break the error transform chain in
     * a non-graceful way. Also accepts promises as return values for asynchronous work.
     * @return {Object} The generated api tree
    */
    constructor(baseUrl, tree, options = {}) {
        this.baseUrl = baseUrl || '';
        this.options = fromJS(options);
        Object.assign(this, parse(this, tree));
    }
}

export default ApiTree;
