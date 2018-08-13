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
    constructor(errorsByKey = {}) {
        const messages = Object.keys(errorsByKey).reduce((accumulator, k) => {
            const errors = errorsByKey[k] || [];

            return accumulator.concat(errors.map((e) => `${k}${e.dataPath}: ${e.message}`));
        }, []);

        super(JSON.stringify(messages, null, 4));
        this.errorsByKey = errorsByKey;
    }

    /**
     * @return {String} The error as a human readable string
     * @private
     */
    toString() {
        return `ValidationError: ${this.message}`;
    }
}
