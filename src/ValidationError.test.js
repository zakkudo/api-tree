import ValidationError from './ValidationError';

describe('ValidationError', () => {
  it('constructs an error with the custom message', () => {
    const error = new ValidationError('test url', [{dataPath: 'testpath', message: 'testmessage'}], 'test schema');
    function toString() {
      return ValidationError.prototype.toString.apply(error);
    }

    expect(error.message).toEqual(`[
    "<test url> testpath: testmessage"
]`);

    expect(toString()).toEqual(`ValidationError: [
    "<test url> testpath: testmessage"
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
});
