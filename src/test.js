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
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
                    params: {
                        type: "object",
                        properties: {
                            firstName: {
                                type: "string",
                                description: "The person's first name.",
                            },
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
            expect(reason).toEqual(new ValidationError('https://backend/v1/users/:id', [{
                dataPath: '.params.firstName',
                message: 'should be string',
            }]));
		});
    });

    it('throws required validation error for params field', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
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
                },
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({params: {}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError('https://backend/v1/users/:id', [{
                dataPath: '.params',
                message: "should have required property 'firstName'",
            }]));
		});
    });

    it('throws no errors when nothing passed for options', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
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
                },
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get().catch((reason) => {
            expect(reason).toEqual(new ValidationError('https://backend/v1/users/:id', [{
                dataPath: '',
                message: "should have required property 'firstName'",
            }]));
		});
    });

    it('throws type validation error for body field', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users', {
			}, {
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
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
                },
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({body: {limit: null}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError('https://backend/v1/users', [{
                dataPath: '.body.limit',
                message: 'should be number',
            }]));
		});
    });

    it('throws type validation error for body field with invalid pattern', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:userId', {
			}, {
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
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
                },
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({params: {userId: 'invalid id'}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError('https://backend/v1/users/:userId', [{
                dataPath: '.params.userId',
                message: 'should match pattern \"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"',
            }]));
		});
    });

    it('throws required validation error for body field', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
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
                },
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get({body: {}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError('https://backend/v1/users/:id', [{
                dataPath: '.body',
                message: "should have required property 'firstName'",
            }]));
		});
    });

    it('throws no errors when nothing passed for options', () => {
        const api = new ApiTree('https://backend/v1', {
            get: ['/users/:id', {
			}, {
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
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
                },
			}],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

		return api.get().catch((reason) => {
            expect(reason).toEqual(new ValidationError('https://backend/v1/users/:id', [{
                dataPath: '',
                message: "should have required property 'firstName'",
            }]));
		});
    });

    it('generates single meaningless override that always gets used', () => {
        const api = new ApiTree('https://backend/v1', {
            get: [
                ['/test/path']
            ],
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

    it('generates single meaningless override that fails validation', () => {
        const api = new ApiTree('https://backend/v1', {
            get: [
                ['/test/path', {}, {
                    $schema: "http://json-schema.org/draft-07/schema#",
                    type: "object",
                    properties: {
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
                    },
                }]
            ],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {}
        });

        return api.get({'params': {id: '1234'}}).catch((reason) => {
            expect(reason).toEqual(new ValidationError('https://backend/v1/test/path', [{
                dataPath: '.params',
                message: "should have required property 'firstName'",
            }]));
        });
    });

    it('uses matching override when first', () => {
        const api = new ApiTree('https://backend/v1', {
            get: [
                ['/test/path/:id'],
                ['/test/path'],
            ],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

        return api.get({'params': {id: '1234'}}).then((response) => {
            expect(Helper.getCallArguments(fetch)).toEqual([[
                'https://backend/v1/test/path/:id',
                {params: {id: '1234'}},
            ]]);
            expect(response).toEqual('test response');
        });
    });

    it('uses matching override when last', () => {
        const api = new ApiTree('https://backend/v1', {
            get: [
                ['/test/path'],
                ['/test/path/:id'],
            ],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

        return api.get({'params': {id: '1234'}}).then((response) => {
            expect(Helper.getCallArguments(fetch)).toEqual([[
                'https://backend/v1/test/path/:id',
                {params: {id: '1234'}},
            ]]);
            expect(response).toEqual('test response');
        });
    });

    it('chooses the first best matching', () => {
        const api = new ApiTree('https://backend/v1', {
            get: [
                ['/test/path/:id'],
                ['/test/path/:id/detail'],
            ],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

        return api.get({'params': {id: '1234'}}).then((response) => {
            expect(Helper.getCallArguments(fetch)).toEqual([[
                'https://backend/v1/test/path/:id',
                {params: {id: '1234'}},
            ]]);
            expect(response).toEqual('test response');
        });
    });

    it('chooses the first best matching when multiple levels', () => {
        const api = new ApiTree('https://backend/v1', {
            get: [
                ['/users'],
                ['/users/:userid'],
                ['/users/:userId/roles'],
                ['/users/:userId/roles/:roleId'],
                ['/users/:userId/roles/:roleId/detail'],
            ],
        });

        expect(JSON.parse(JSON.stringify(api))).toEqual({
            baseUrl: 'https://backend/v1',
            options: {},
        });

        return api.get({'params': {userId: '1234', roleId: '5678'}}).then((response) => {
            expect(Helper.getCallArguments(fetch)).toEqual([[
                'https://backend/v1/users/:userId/roles/:roleId',
                {params: {userId: '1234', roleId: '5678'}},
            ]]);
            expect(response).toEqual('test response');
        });
    });
});
