/**
 * An error used for future code branches that
 * are not implemented yet.
 * @module ValidationError
 */
export default class ValidationError extends Error {
    /**
     * @return {String} The error as a human readable string
     */
    toString() {
        return `ValidationError: ${this.message}`;
    }
}
