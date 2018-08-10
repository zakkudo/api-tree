## Modules

<dl>
<dt><a href="#module_ValidationError">ValidationError</a></dt>
<dd><p>An error used for future code branches that
are not implemented yet.</p>
</dd>
<dt><a href="#module_lib/ApiTree">lib/ApiTree</a></dt>
<dd><p>Converts a configuration into an easy to use api tree.</p>
</dd>
</dl>

<a name="module_ValidationError"></a>

## ValidationError
An error used for future code branches that
are not implemented yet.

<a name="module_ValidationError+toString"></a>

### validationError.toString() ⇒ <code>String</code>
**Kind**: instance method of [<code>ValidationError</code>](#module_ValidationError)  
**Returns**: <code>String</code> - The error as a human readable string  
<a name="module_lib/ApiTree"></a>

## lib/ApiTree
Converts a configuration into an easy to use api tree.


* [lib/ApiTree](#module_lib/ApiTree)
    * [module.exports](#exp_module_lib/ApiTree--module.exports) ⏏
        * [new module.exports(baseUrl, tree, options)](#new_module_lib/ApiTree--module.exports_new)

<a name="exp_module_lib/ApiTree--module.exports"></a>

### module.exports ⏏
**Kind**: Exported class  
<a name="new_module_lib/ApiTree--module.exports_new"></a>

#### new module.exports(baseUrl, tree, options)

| Param | Type | Description |
| --- | --- | --- |
| baseUrl | <code>String</code> | The url to concat with all paths |
| tree | <code>\*</code> | The configuration tree for the apis |
| options | <code>Object</code> | Options that will be the default base init for fetch operations. Other inits are layered on top of this. |

