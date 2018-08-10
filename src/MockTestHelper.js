import {fromJS} from 'immutable';

/**
 * @private
 */
function removeImmutable(call) {
    return fromJS(call).toJS();
}

export default class MockTestHelper {
    static getCallArguments(mock) {
        return mock.mock.calls.map(removeImmutable);
    }
}

