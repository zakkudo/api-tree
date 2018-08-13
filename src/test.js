import ApiTree from '.';
import ValidationError from './ValidationError';
import fetch from '@zakkudo/fetch';
import Helper from './MockTestHelper';

jest.mock('@zakkudo/fetch');

describe('ApiTree', () => {
    beforeEach(() => {
        fetch.mockReset();
        fetch.mockReturnValue(Promise.resolve('test response'));
    });

    it('generates implied get', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/test/path'],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

        return api.get({'params': {id: '1234'}}).then((response) => {
            expect(Helper.getCallArguments(fetch)).toEqual([[
                'https://backend/v1/test/path',
                {params: {id: '1234'}},
            ]]);
            expect(response).toEqual('test response');
        });
    });

    it('passes through the convenience function', () => {
        const api = new ApiTree('https://backend/v1', {
            users: {
                get: ['/users/:id'],
                getSpecifically(options) {
                    return api.users.get({'params': {'id': '1234'}});
                },
            },
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            users: {},
            options: {},
        });

        return api.users.getSpecifically({'params': {id: '1234'}}).then((response) => {
            expect(Helper.getCallArguments(fetch)).toEqual([[
                'https://backend/v1/users/:id',
                {params: {id: '1234'}},
            ]]);
            expect(response).toEqual('test response');
        });
    });

    it('passes through other data', () => {
        const api = new ApiTree('https://backend/v1', {
            users: {
                count: 10,
            },
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            users: {count: 10},
            options: {},
        });
    });

    it('falls back to a blank string if no base url', () => {
        const api = new ApiTree(null, {
            users: {
                count: 10,
            },
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: '',
            users: {count: 10},
            options: {},
        });
    });

    it('throws type validation error for params field', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
				params: {
					type: "object",
                    //required: [ "latitude", "longitude" ],
					properties: {
						firstName: {
							type: "string",
							description: "The person's first name.",
						},
					},
				},
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({params: {firstName: null}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError({params: [{
                dataPath: '.firstName',
                message: 'should be string',
            }]}));
		});
    });

    it('throws required validation error for params field', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
				params: {
					type: "object",
                    required: [ "firstName" ],
					properties: {
						firstName: {
							type: "string",
							description: "The person's first name.",
						},
					},
				},
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({params: {}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError({params: [{
                dataPath: '',
                message: "should have required property 'firstName'",
            }]}));
		});
    });

    it('throws no errors when nothing passed for options', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
				params: {
					type: "object",
                    required: [ "firstName" ],
					properties: {
						firstName: {
							type: "string",
							description: "The person's first name.",
						},
					},
				},
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get().catch((reason) => {
            expect(reason).toEqual(new ValidationError({params: [{
                dataPath: '',
                message: "should have required property 'firstName'",
            }]}));
		});
    });

    it('throws type validation error for body field', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users', {
			}, {
				body: {
					type: "object",
                    required: [ "limit" ],
					properties: {
						limit: {
							type: "number",
							description: "Max number of results to return.",
						},
					},
				},
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({body: {limit: null}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError({body: [{
                dataPath: '.limit',
                message: 'should be number',
            }]}));
		});
    });

    it('throws type validation error for body field with invalid pattern', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:userId', {
			}, {
				params: {
					type: "object",
                    required: [ "userId" ],
					properties: {
						userId: {
							type: "string",
                            pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
							description: "The Users Id.",
						},
					},
				},
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({params: {userId: 'invalid id'}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError({params: [{
                dataPath: '.userId',
                message: 'should match pattern \"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"',
            }]}));
		});
    });

    it('throws required validation error for body field', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
				body: {
					type: "object",
                    required: [ "firstName" ],
					properties: {
						firstName: {
							type: "string",
							description: "The person's first name.",
						},
					},
				},
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({body: {}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError({body: [{
                dataPath: '',
                message: "should have required property 'firstName'",
            }]}));
		});
    });

    it('throws no errors when nothing passed for options', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
				body: {
					type: "object",
                    required: [ "firstName" ],
					properties: {
						firstName: {
							type: "string",
							description: "The person's first name.",
						},
					},
				},
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get().catch((reason) => {
            expect(reason).toEqual(new ValidationError({body: [{
                dataPath: '',
                message: "should have required property 'firstName'",
            }]}));
		});
    });
});
