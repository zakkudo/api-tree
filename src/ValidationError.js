/**
 * @module @zakkudo/api-tree/ValiationError
 */

/**
 * An error used to represent a list of validation issues generated from a JSON schema.
 * @extends Error
 */
class ValidationError extends Error {
    /**
     * @param {String} url - The url when the validation errors were found
     * @param {Array<String>} errors - The list of the validation errors
     * @param {Object} schema - The JSON schema used to generated the validation errors
     */
    constructor(url, errors = [], schema) {
        const messages = errors.map((e) => `<${url}> ${e.dataPath}: ${e.message}`);

        super(JSON.stringify(messages, null, 4));

        /**
         * The list of validaiton errors
         */
        this.errors = errors;

        /**
         * The JSON schema used to generated the validation errors
         */
        this.schema = schema;
    }

    /**
     * @private
     */
    toString() {
        return `ValidationError: ${this.message}`;
    }
}

export default ValidationError;
