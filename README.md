# Sharp AWS image handler client

_Note: this ES6 module needs to be transpiled for browser compatibility, using a tool like babel in your upstream project._

## Docs

  Prepares CDN image URL with appropriate filters relying on AWS image handler (v4) that leverages sharp.
This lets you build CDN image URLs with sharp edit operations, such as resizing or WebP compression.
https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/deployment.html

**Example**  
```js
import { Cdn } from 'sharp-aws-image-handler-client'
const cdn = new Cdn({
 base: 'https://my-distribution.cloudfront.net/,
 bucket: 's3-bucket-name,
})
```

* [sharp-aws-image-handler-client](#module_sharp-aws-image-handler-client)
    * [.Cdn](#module_sharp-aws-image-handler-client.Cdn)
        * [new exports.Cdn()](#new_module_sharp-aws-image-handler-client.Cdn_new)
        * [.base](#module_sharp-aws-image-handler-client.Cdn+base) : <code>String</code>
        * [.bucket](#module_sharp-aws-image-handler-client.Cdn+bucket) : <code>String</code>
        * [.s3BucketUrl](#module_sharp-aws-image-handler-client.Cdn+s3BucketUrl) : <code>String</code>
        * [.servedFromCdnBucket(uri, [base], [bucketUrl])](#module_sharp-aws-image-handler-client.Cdn+servedFromCdnBucket) : <code>function</code>
    * [.getUrl(uri, [edits], [options])](#module_sharp-aws-image-handler-client.getUrl) ⇒ <code>String</code>

<a name="module_sharp-aws-image-handler-client.Cdn"></a>

### cdn.Cdn
**Kind**: static class of [<code>sharp-aws-image-handler-client</code>](#module_sharp-aws-image-handler-client)  

* [.Cdn](#module_sharp-aws-image-handler-client.Cdn)
    * [new exports.Cdn()](#new_module_sharp-aws-image-handler-client.Cdn_new)
    * [.base](#module_sharp-aws-image-handler-client.Cdn+base) : <code>String</code>
    * [.bucket](#module_sharp-aws-image-handler-client.Cdn+bucket) : <code>String</code>
    * [.s3BucketUrl](#module_sharp-aws-image-handler-client.Cdn+s3BucketUrl) : <code>String</code>
    * [.servedFromCdnBucket(uri, [base], [bucketUrl])](#module_sharp-aws-image-handler-client.Cdn+servedFromCdnBucket) : <code>function</code>

<a name="new_module_sharp-aws-image-handler-client.Cdn_new"></a>

#### new exports.Cdn()
Instantiates class with CDN parameters

<a name="module_sharp-aws-image-handler-client.Cdn+base"></a>

#### cdn.base : <code>String</code>
Base URL of CDN handling images, such as `https://cdn.stelace.com`

**Kind**: instance property of [<code>Cdn</code>](#module_sharp-aws-image-handler-client.Cdn)  
<a name="module_sharp-aws-image-handler-client.Cdn+bucket"></a>

#### cdn.bucket : <code>String</code>
Plain S3 bucket name such as 'my-files'

**Kind**: instance property of [<code>Cdn</code>](#module_sharp-aws-image-handler-client.Cdn)  
<a name="module_sharp-aws-image-handler-client.Cdn+s3BucketUrl"></a>

#### cdn.s3BucketUrl : <code>String</code>
S3 bucket URL

**Kind**: instance property of [<code>Cdn</code>](#module_sharp-aws-image-handler-client.Cdn)  
**Read only**: true  
<a name="module_sharp-aws-image-handler-client.Cdn+servedFromCdnBucket"></a>

#### cdn.servedFromCdnBucket(uri, [base], [bucketUrl]) : <code>function</code>
Lets you check that a file URI is served from CDN before trying to apply image edits in `getUrl` method.
Can return:

  - falsy value: `getUrl(uri, edits)` method will simply return uri and ignore edits.
  - truthy value: `getUrl(uri, edits)` will build the URL with sharp edits.
  - string: used as one-time bucket override in `getUrl` & having the same effect as a truthy value.

**Kind**: instance method of [<code>Cdn</code>](#module_sharp-aws-image-handler-client.Cdn)  
**Default**: <code>(uri, base, bucketUrl) &#x3D;&gt; uri.startsWith(base) || uri.startsWith(bucketUrl)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>String</code> |  | File `uri` can be an URL including host and protocol |
| [base] | <code>String</code> | <code>cdn.base</code> | Base URL of CDN handling images to check against |
| [bucketUrl] | <code>String</code> | <code>cdn.s3BucketUrl</code> | S3 bucket URL to check against |

<a name="module_sharp-aws-image-handler-client.getUrl"></a>

### cdn.getUrl(uri, [edits], [options]) ⇒ <code>String</code>
Turn CDN file URI into image URL with edit operations.
If `uri` is a full URL and the file is not served from CDN, `uri` is return unchanged.

**Kind**: static method of [<code>sharp-aws-image-handler-client</code>](#module_sharp-aws-image-handler-client)  
**Returns**: <code>String</code> - full URL with encoded edits  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>String</code> |  | File `uri` can be an URL including host and protocol. |
| [edits] | <code>Object</code> |  | only used if image is served from CDN with image handler.    This object can include any sharp transform, like `edits: { webp: true }`. |
| [options] | <code>Object</code> |  |  |
| [options.bucket] | <code>String</code> | <code>cdn.bucket</code> | overriding default bucket    and any bucket returned by `servedFromCdnBucket` method. |

**Example**  
```js
import { Cdn } from 'sharp-aws-image-handler-client'
const cdn = new Cdn({
 base: 'https://my-distribution.cloudfront.net/,
 bucket: 's3-bucket-name
})

const url = cdn.getUrl('filename.jpg', {
  webp: true,
  resize: { width: 800, height: 600 }
})
```

### Utility

  #### testWebP
  Tests asynchronously if WebP is supported by browser.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - WebP support in current browser  
**Example**  
```js
import { testWebP } from 'sharp-aws-image-handler-client'
const supportsWebP = await testWebP()
```
