import ValidationError from './ValidationError';

describe('ValidationError', () => {
    it('constructs an error with the custom message', () => {
        const error = new ValidationError('test message');

        expect(error.message).toEqual('test message');
        expect(String(error)).toEqual('ValidationError: test message');
    });
});
