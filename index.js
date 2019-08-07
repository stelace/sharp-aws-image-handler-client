/**
 * Prepares CDN image URL with appropriate filters relying on AWS image handler (v4) that leverages sharp.
 * This lets you build CDN image URLs with sharp edit operations, such as resizing or WebP compression.
 * https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/deployment.html
 * @module sharp-aws-image-handler-client
 * @typicalname cdn
 * @example
 * ```js
 * import { Cdn } from 'sharp-aws-image-handler-client'
 * const cdn = new Cdn({
 *  base: 'https://my-distribution.cloudfront.net/,
 *  bucket: 's3-bucket-name,
 * })
 * ```
*/

export class Cdn {
  /**
   * Instantiates class with CDN parameters
   */
  constructor ({ base, bucket, servedFromCdnBucket, warnings = true } = {}) {
    /**
     * Base URL of CDN handling images, such as `https://cdn.stelace.com`
     * @type {String}
     */
    this.base = base

    /**
     * Plain S3 bucket name such as 'my-files'
     * @type {String}
     */
    this.bucket = bucket

    /**
     * S3 bucket URL
     * @type {String}
     * @readonly
     */
    this.s3BucketUrl = `https://${this.bucket}.s3.amazonaws.com`

    /**
     * Using `console.warn` for potential errors like non-ascii or special chars in S3 file key
     * @type {Boolean}
     * @default true
     */
    this.warnings = warnings

    /**
     * Lets you check that a file URI is served from CDN before trying to apply image edits in `getUrl` method.
     * Can return:
     *
     *   - falsy value: `getUrl(uri, edits)` method will simply return uri and ignore edits.
     *   - truthy value: `getUrl(uri, edits)` will build the URL with sharp edits.
     *   - string: used as one-time bucket override in `getUrl` & having the same effect as a truthy value.
     *
     * @type {Function}
     * @param {String} uri - File `uri` can be an URL including host and protocol
     * @param {String} [base=cdn.base] - Base URL of CDN handling images to check against
     * @param {String} [bucketUrl=cdn.s3BucketUrl] - S3 bucket URL to check against
     * @default (uri, base, bucketUrl) => uri.startsWith(base) || uri.startsWith(bucketUrl)
     */
    this.servedFromCdnBucket = (uri, base = this.base, bucketUrl = this.s3BucketUrl) => {
      if (typeof uri !== 'string') return false
      return typeof servedFromCdnBucket === 'function'
        ? servedFromCdnBucket(uri, base, bucketUrl)
        : (uri.startsWith(base) || uri.startsWith(bucketUrl))
    }
  }

  /**
   * Turns CDN file URI into image URL with edit operations.
   * If `uri` is a full URL and the file is not served from CDN, `uri` is return unchanged.
   * @param {String} uri - File `uri` can be an URL including host and protocol.
   * @param {Object} [edits] - only used if image is served from CDN with image handler.
   *    This object can include any sharp transform, like `edits: { webp: true }`.
   * @param {Object} [options]
   * @param {String} [options.bucket=cdn.bucket] - overriding default bucket
   *    and any bucket returned by `servedFromCdnBucket` method.
   * @returns {String} full URL with encoded edits
   * @alias module:sharp-aws-image-handler-client.getUrl
   *
   * @example
   * ```js
   * import { Cdn } from 'sharp-aws-image-handler-client'
   * const cdn = new Cdn({
   *  base: 'https://my-distribution.cloudfront.net/,
   *  bucket: 's3-bucket-name
   * })
   *
   * const url = cdn.getUrl('filename.jpg', {
   *   webp: true,
   *   resize: { width: 800, height: 600 }
   * })
   * ```
   */
  getUrl (uri, edits = {}, options = {}) {
    let path
    const cdnBucket = this.servedFromCdnBucket(uri)

    // aws sharp handler seems to considers mere key presence to enable webp, even with falsy value
    if (Object.keys(edits).includes('webp') && !edits.webp) delete edits.webp

    try {
      const url = new URL(uri)
      path = url.pathname
    } catch (e) {
      if (/valid URL/i.test(e.message)) path = uri // filename URI is an invalid URL
      else return uri
    }

    try {
      if (!cdnBucket) return uri
      // URL class automatically encodes path, which we don’t want in this object
      // so we can match key in AWS image handler
      const key = decodeURIComponent(path.replace(/^\//, ''))
      const imageRequest = JSON.stringify({
        bucket: options.bucket || (typeof cdnBucket === 'string' ? cdnBucket : this.bucket),
        key,
        edits
      })

      // AWS serverless image handler only supports ascii chars in key
      // https://github.com/awslabs/serverless-image-handler/blob/9ccdb7180c7881eb78c220f3958b671d968c16dd/source/image-handler/image-request.js#L199
      if (this.warnings && key !== getSafeS3String(key)) {
        console.warn(`Special chars in “${key}” are not safe to use with AWS Lambda image handler.`)
      }

      return `${
        this.base.replace(/\/$/, '') || ''
      }/${
        /*
         * By default window.btoa uses UTF-16, not UTF-8, but we can’t methods such as
         * `btoa(unescape(encodeURIComponent(imageRequest)))`
         * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa#Unicode_strings
         * since AWS image handler does not support ascii chars and we’d rather not maintain a fork
         */
        btoa(imageRequest)
      }`
    } catch (e) {
      return uri
    }
  }
}

/**
 * Tests asynchronously if WebP is supported by browser.
 * @type {Function}
 * @returns {Promise<Boolean>} WebP support in current browser
 * @alias testWebP
 *
 * @example
 * ```js
 * import { testWebP } from 'sharp-aws-image-handler-client'
 * const supportsWebP = await testWebP()
 * ```
 */
export async function testWebP () {
  return new Promise(resolve => {
    const webP = new Image()
    // Plain WepP inspired from Modernizr test. Not testing alpha, lossless or animated
    webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='
    webP.onload = webP.onerror = function () {
      resolve(webP.width === 1)
    }
  })
}

/**
 * Make uri/filename safe for S3.
 * https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
 * @type {Function}
 * @param {String} string
 * @returns {String} Safe string
 * @alias getSafeS3String
 *
 * @example
 * ```js
 * import { getSafeS3String } from 'sharp-aws-image-handler-client'
 * const unsafe = 'special~©harŝ éeè.png'
 * const safe = getSafeS3String(unsafe) // specialhar-e.png
 * ```
*/
export function getSafeS3String (str) {
  return str
    .replace(/\s+/gm, '-')
    .replace(/([^\w-!./])/gm, '')
}
