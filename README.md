<a name="module_ApiTree"></a>

## ApiTree
Make working with backend api trees enjoyable.

[![Build Status](https://travis-ci.org/zakkudo/api-tree.svg?branch=master)](https://travis-ci.org/zakkudo/api-tree)
[![Coverage Status](https://coveralls.io/repos/github/zakkudo/api-tree/badge.svg?branch=master)](https://coveralls.io/github/zakkudo/api-tree?branch=master)

Generate an
easy to use api tree that includes format checking using
[JSON Schema](http://json-schema.org/) for the body and params
with only a single configuration object. Network calls are executed using
a thin convenience wrapper around
[fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

If you're using [swagger](https://swagger.io/)/[openapi](https://www.openapis.org/),
checkout `@zakkudo/open-api-tree` which generates this configuration for
you from swagger's metadata.

Why use this?

- Consistancy with simplicity
- Leverages native fetch, adding a thin convenience layer.
- Use json schemas to ensure correct usage of the apis
- Share authorization handling using a single location that can be updated dynamically
- Share a single transform for the responses and request in a location that can be updated dynamically
- Supports overloading the tree methods so that you can use the same method
  for getting a single item or a collection of items

Install with:

```console
yarn add @zakkudo/api-tree
```

**Example**  
```js
import ApiTree from '@zakkudo/api-tree';
import HttpError from '@zakkudo/api-tree/HttpError';
import ValidationError from '@zakkudo/api-tree/ValidationError';

const api = new ApiTree('https://backend', {
    users: {
        post: ['/v1/users', {method: 'POST'}, {
             $schema: "http://json-schema.org/draft-07/schema#",
             type: 'object',
             properties: {
                 body: {
                     type: 'object',
                     required: ['first_name', 'last_name'],
                     properties: {
                          first_name: {
                              type: 'string'
                          },
                          last_name: {
                              type: 'string'
                          },
                     },
                 },
             },
        }],
        get: [
            ['/v1/users'], //Endpoint overloading.  If userId is provided as a param, the
                           //second endpoint is automatically used
            ['/v2/users/:userId', {}, {
                 $schema: "http://json-schema.org/draft-07/schema#",
                 type: 'object',
                 properties: {
                     params: {
                         type: 'object',
                         required: ['userId'],
                         properties: {
                              userId: {
                                  type: 'string',
                                  pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
                              },
                         },
                     },
                 },
            }],
        ],
    }
}, {
    headers: {
         'X-AUTH-TOKEN': '1234'
    },
    transformError(reason) {
        if (reason instanceof HttpError && reason.status === 401) {
            login();
        }

        return reason;
    }
});

//Set headers after the fact
api.options.headers['X-AUTH-TOKEN'] = '5678';

//Get 10 users
api.users.get({params: {limit: 10}}).then((users) => {
     console.log(users); // [{id: ...}, ...]
});

//Create a user
api.users.post({first_name: 'John', last_name: 'Doe'}).then((response) => {
     console.log(response); // {id: 'ff599c67-1cac-4167-927e-49c02c93625f', first_name: 'John', last_name: 'Doe'}
});

// Try using a valid id
api.users.get({params: {userId: 'ff599c67-1cac-4167-927e-49c02c93625f'}}).then((user) => {
     console.log(user); // {id: 'ff599c67-1cac-4167-927e-49c02c93625f', first_name: 'john', last_name: 'doe'}
})

// Try fetching without an id
api.users.get().catch((reason) => {
     console.log(reason instanceof ValidationError); //true
     console.log(reason); // "params: should have required property 'userId'
})

// Try using an invalidly formatted id
api.users.get({params: {userId: 'invalid format'}}).catch((reason) => {
     console.log(reason instanceof ValidationError); //true
     console.log(reason); // "params.userId: should match pattern \"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\""
});

// Force execution with an invalidly formatted id
api.users.get({params: {userId: 'invalid format'}}, false).catch((reason) => {
     console.log(reason instanceof HttpError); //true
     console.log(reason.status); // 500
});

// Override the global options at any time
api.users.get({transformResponse: () => 'something else'}).then((response) => {
   console.log(response); // 'something else'
});
```

* [ApiTree](#module_ApiTree)
    * [module.exports](#exp_module_ApiTree--module.exports) ⏏
        * [new module.exports(baseUrl, tree, options)](#new_module_ApiTree--module.exports_new)

<a name="exp_module_ApiTree--module.exports"></a>

### module.exports ⏏
**Kind**: Exported class  
<a name="new_module_ApiTree--module.exports_new"></a>

#### new module.exports(baseUrl, tree, options)
**Returns**: <code>Object</code> - The generated api tree  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| baseUrl | <code>String</code> |  | The url to prefix with all paths |
| tree | <code>\*</code> |  | The configuration tree for the apis. Accepts a deeply nested set of objects where array are interpreted to be of the form `[path, options, schema]`. Thos array are converted into api fetching functions. |
| options | <code>Object</code> |  | Options modifying the network call, mostly analogous to fetch |
| [options.method] | <code>String</code> | <code>&#x27;GET&#x27;</code> | GET, POST, PUT, DELETE, etc. |
| [options.mode] | <code>String</code> | <code>&#x27;same-origin&#x27;</code> | no-cors, cors, same-origin |
| [options.cache] | <code>String</code> | <code>&#x27;default&#x27;</code> | default, no-cache, reload, force-cache, only-if-cached |
| [options.credentials] | <code>String</code> | <code>&#x27;omit&#x27;</code> | include, same-origin, omit |
| options.headers | <code>String</code> |  | "application/json; charset=utf-8". |
| [options.redirect] | <code>String</code> | <code>&#x27;follow&#x27;</code> | manual, follow, error |
| [options.referrer] | <code>String</code> | <code>&#x27;client&#x27;</code> | no-referrer, client |
| [options.body] | <code>String</code> \| <code>Object</code> |  | `JSON.stringify` is automatically run for non-string types |
| [options.params] | <code>String</code> \| <code>Object</code> |  | Query params to be appended to the url. The url must not already have params.  The serialization uses the same rules as used by `@zakkudo/query-string` |
| [options.transformRequest] | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transforms for the request body. When not supplied, it by default json serializes the contents if not a simple string. Also accepts promises as return values for asynchronous work. |
| [options.transformResponse] | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transform the response.  Also accepts promises as return values for asynchronous work. |
| [options.transformError] | <code>function</code> \| <code>Array.&lt;function()&gt;</code> |  | Transform the error response. Return the error to keep the error state.  Return a non `Error` to recover from the error in the promise chain.  A good place to place a login handler when recieving a `401` from a backend endpoint or redirect to another page. It's preferable to never throw an error here which will break the error transform chain in a non-graceful way. Also accepts promises as return values for asynchronous work. |

