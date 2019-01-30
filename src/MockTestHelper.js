
export default class MockTestHelper {
  static getCallArguments(mock) {
    return mock.mock.calls;
  }
}

