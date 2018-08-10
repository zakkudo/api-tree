import ApiTree from '.';
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
});
