/**
 * An error used for future code branches that
 * are not implemented yet.
 * @module ValidationError
 * @private
 */
export default class ValidationError extends Error {
    /**
     * @private
     */
    constructor(url, errors = [], schema) {
        const messages = errors.map((e) => `<${url}> ${e.dataPath}: ${e.message}`);

        super(JSON.stringify(messages, null, 4));
        this.errors = errors;
        this.schema = schema;
    }

    /**
     * @return {String} The error as a human readable string
     * @private
     */
    toString() {
        return `ValidationError: ${this.message}`;
    }
}
