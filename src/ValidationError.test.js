import ValidationError from './ValidationError';

describe('ValidationError', () => {
    it('constructs an error with the custom message', () => {
        const error = new ValidationError({'params': [{dataPath: 'testpath', message: 'testmessage'}]});
        function toString() {
            return ValidationError.prototype.toString.apply(error);
        }

        expect(error.message).toEqual(`[
    "paramstestpath: testmessage"
]`);

        expect(toString()).toEqual(`ValidationError: [
    "paramstestpath: testmessage"
]`);
    });

    it('works when no constructor value passed in', () => {
        const error = new ValidationError();
        function toString() {
            return ValidationError.prototype.toString.apply(error);
        }

        expect(error.message).toEqual(`[]`);

        expect(toString()).toEqual(`ValidationError: []`);
    });


    it('works when error value is null', () => {
        const error = new ValidationError({params: null});
        function toString() {
            return ValidationError.prototype.toString.apply(error);
        }

        expect(error.message).toEqual(`[]`);

        expect(toString()).toEqual(`ValidationError: []`);
    });
});
