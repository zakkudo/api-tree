# @zakkudo/api-tree

Make working with backend api trees enjoyable.

[![Build Status](https://travis-ci.org/zakkudo/api-tree.svg?branch=master)](https://travis-ci.org/zakkudo/api-tree)
[![Coverage Status](https://coveralls.io/repos/github/zakkudo/api-tree/badge.svg?branch=master)](https://coveralls.io/github/zakkudo/api-tree?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/zakkudo/api-tree/badge.svg)](https://snyk.io/test/github/zakkudo/api-tree)
[![Node](https://img.shields.io/node/v/@zakkudo/api-tree.svg)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/@zakkudo/api-tree.svg)](https://opensource.org/licenses/BSD-3-Clause)

Generate an
easy to use api tree that includes format checking using
[JSON Schema](http://json-schema.org/) for the body and params
with only a single configuration object. Network calls are executed using
a thin convenience wrapper around
[fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

If you're using [swagger](https://swagger.io/)/[openapi](https://www.openapis.org/),
checkout `@zakkudo/open-api-tree` which generates this configuration for
you from swagger's metadata.

## Why use this?

- Consistancy with simplicity
- Leverages native fetch, adding a thin convenience layer.
- Use json schemas to ensure correct usage of the apis
- Share authorization handling using a single location that can be updated dynamically
- Share a single transform for the responses and request in a location that can be updated dynamically
- Supports overloading the tree methods so that you can use the same method
  for getting a single item or a collection of items

## Install

``` console
# Install using npm
npm install @zakkudo/api-tree
```

``` console
# Install using yarn
yarn add @zakkudo/api-tree
```

## Examples

### Base example
``` javascript
// Api methods are simply generated whenever an array is found in the object tree.
const api = new ApiTree({get: [url, apiDefaultOptions, schema]}, treeDefaultOptions);

// The url and default options are predetermed during construction, but the options are overridable on the final function call
api.get(overrideOptions);

// Or don't override anything
api.get();

//ApiTree merges the different scopes of options to provide many different levels for overriding settings
fetch(url, Object.assign({}, treeDefaultOptions, apiDefaultOptions, overrideOptions));
```

### Overloading a function
``` javascript
//When an api is overloaded by having a nested array, the one with the closest url/params signature will be selected
const first = ['/users/:userId'];
const second = ['/users', {params: {limit: 10}}];
const api = new ApiTree({get: [first, second]}, treeDefaultOptions);

api.get({params: {userId: '1234'}}); // Uses the first config, making a GET /users/1234
api.get(); // Uses the second config, making a GET /users?limit=10
```

### Adding a convenience function
``` javascript
//Sometimes you'll want a function in the api tree that you made yourself
const api = new ApiTree({
    delete: [url, {method: 'DELETE'}],
    deleteAll(ids) {
        console.log(this.base, this.options); // You have direct access to the configuration of the api tree

        return Promise.all(ids.map((i) => api.delete({params: {userId: i}})));
    }
}, treeDefaultOptions);

api.delete({params: {userId: '1234'}});
api.deleteAll(['1234', '4556']);
```

### Passing through data
``` javascript
//It's not generally recommended, but any primitive data is just passed through as-is
const api = new ApiTree({limit: 10, name: 'my great api', enabled: true});
console.log(api.limit); // 10
console.log(api.name); // 'my great api'
console.log(api.enabled); // true
```

### Full example
``` javascript
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

## API

<a name="module_@zakkudo/api-tree"></a>

<a name="module_@zakkudo/api-tree..ApiTree"></a>

### @zakkudo/api-tree~ApiTree ⏏

**Kind**: Exported class

<a name="new_module_@zakkudo/api-tree..ApiTree_new"></a>

#### new ApiTree(baseUrl, tree, options)
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

<a name="module_@zakkudo/api-tree/ValiationError"></a>

<a name="module_@zakkudo/api-tree/ValiationError..ValidationError"></a>

### @zakkudo/api-tree/ValiationError~ValidationError ⇐ <code>Error</code> ⏏
An error used to represent a list of validation issues generated from a JSON schema.

**Kind**: Exported class

**Extends**: <code>Error</code>  

* [~ValidationError](#module_@zakkudo/api-tree/ValiationError..ValidationError) ⇐ <code>Error</code>
    * [new ValidationError(url, errors, schema)](#new_module_@zakkudo/api-tree/ValiationError..ValidationError_new)
    * [.errors](#module_@zakkudo/api-tree/ValiationError..ValidationError+errors)
    * [.schema](#module_@zakkudo/api-tree/ValiationError..ValidationError+schema)

<a name="new_module_@zakkudo/api-tree/ValiationError..ValidationError_new"></a>

#### new ValidationError(url, errors, schema)

| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> | The url when the validation errors were found |
| errors | <code>Array.&lt;String&gt;</code> | The list of the validation errors |
| schema | <code>Object</code> | The JSON schema used to generated the validation errors |

<a name="module_@zakkudo/api-tree/ValiationError..ValidationError+errors"></a>

#### validationError.errors
The list of validaiton errors

**Kind**: instance property of [<code>ValidationError</code>](#module_@zakkudo/api-tree/ValiationError..ValidationError)  
<a name="module_@zakkudo/api-tree/ValiationError..ValidationError+schema"></a>

#### validationError.schema
The JSON schema used to generated the validation errors

**Kind**: instance property of [<code>ValidationError</code>](#module_@zakkudo/api-tree/ValiationError..ValidationError)  
<a name="module_@zakkudo/api-tree/HttpError"></a>

<a name="module_@zakkudo/api-tree/HttpError..HttpError"></a>

### @zakkudo/api-tree/HttpError~HttpError ⏏
Aliased error from package `@zakkudo/fetch/HttpError`

**Kind**: Exported class

<a name="module_@zakkudo/api-tree/UrlError"></a>

<a name="module_@zakkudo/api-tree/UrlError..UrlError"></a>

### @zakkudo/api-tree/UrlError~UrlError ⏏
Aliased error from package `@zakkudo/fetch/UrlError`

**Kind**: Exported class

<a name="module_@zakkudo/api-tree/QueryStringError"></a>

<a name="module_@zakkudo/api-tree/QueryStringError..QueryStringError"></a>

### @zakkudo/api-tree/QueryStringError~QueryStringError ⏏
Aliased error from package `@zakkudo/fetch/QueryStringError`

**Kind**: Exported class

