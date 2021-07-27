var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, Readable, wm, Blob, fetchBlob, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size2 = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size2 += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size: size2,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size: size2 } = this;
        let relativeStart = start < 0 ? Math.max(size2 + start, 0) : Math.min(start, size2);
        let relativeEnd = end < 0 ? Math.max(size2 + end, 0) : Math.min(end, size2);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size3 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size3 <= relativeStart) {
            relativeStart -= size3;
            relativeEnd -= size3;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size3, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size: size2 = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size2;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new fetchBlob([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
    globalThis.fetch = fetch;
    globalThis.Response = Response;
    globalThis.Request = Request;
    globalThis.Headers = Headers;
  }
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-vercel/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/js-yaml/lib/js-yaml/common.js
var require_common = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/common.js"(exports, module2) {
    init_shims();
    "use strict";
    function isNothing(subject) {
      return typeof subject === "undefined" || subject === null;
    }
    function isObject(subject) {
      return typeof subject === "object" && subject !== null;
    }
    function toArray(sequence) {
      if (Array.isArray(sequence))
        return sequence;
      else if (isNothing(sequence))
        return [];
      return [sequence];
    }
    function extend(target, source) {
      var index2, length, key, sourceKeys;
      if (source) {
        sourceKeys = Object.keys(source);
        for (index2 = 0, length = sourceKeys.length; index2 < length; index2 += 1) {
          key = sourceKeys[index2];
          target[key] = source[key];
        }
      }
      return target;
    }
    function repeat(string, count) {
      var result = "", cycle;
      for (cycle = 0; cycle < count; cycle += 1) {
        result += string;
      }
      return result;
    }
    function isNegativeZero(number) {
      return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
    }
    module2.exports.isNothing = isNothing;
    module2.exports.isObject = isObject;
    module2.exports.toArray = toArray;
    module2.exports.repeat = repeat;
    module2.exports.isNegativeZero = isNegativeZero;
    module2.exports.extend = extend;
  }
});

// node_modules/js-yaml/lib/js-yaml/exception.js
var require_exception = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/exception.js"(exports, module2) {
    init_shims();
    "use strict";
    function YAMLException(reason, mark) {
      Error.call(this);
      this.name = "YAMLException";
      this.reason = reason;
      this.mark = mark;
      this.message = (this.reason || "(unknown reason)") + (this.mark ? " " + this.mark.toString() : "");
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error().stack || "";
      }
    }
    YAMLException.prototype = Object.create(Error.prototype);
    YAMLException.prototype.constructor = YAMLException;
    YAMLException.prototype.toString = function toString(compact) {
      var result = this.name + ": ";
      result += this.reason || "(unknown reason)";
      if (!compact && this.mark) {
        result += " " + this.mark.toString();
      }
      return result;
    };
    module2.exports = YAMLException;
  }
});

// node_modules/js-yaml/lib/js-yaml/mark.js
var require_mark = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/mark.js"(exports, module2) {
    init_shims();
    "use strict";
    var common2 = require_common();
    function Mark(name, buffer, position, line, column) {
      this.name = name;
      this.buffer = buffer;
      this.position = position;
      this.line = line;
      this.column = column;
    }
    Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
      var head, start, tail, end, snippet;
      if (!this.buffer)
        return null;
      indent = indent || 4;
      maxLength = maxLength || 75;
      head = "";
      start = this.position;
      while (start > 0 && "\0\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(start - 1)) === -1) {
        start -= 1;
        if (this.position - start > maxLength / 2 - 1) {
          head = " ... ";
          start += 5;
          break;
        }
      }
      tail = "";
      end = this.position;
      while (end < this.buffer.length && "\0\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(end)) === -1) {
        end += 1;
        if (end - this.position > maxLength / 2 - 1) {
          tail = " ... ";
          end -= 5;
          break;
        }
      }
      snippet = this.buffer.slice(start, end);
      return common2.repeat(" ", indent) + head + snippet + tail + "\n" + common2.repeat(" ", indent + this.position - start + head.length) + "^";
    };
    Mark.prototype.toString = function toString(compact) {
      var snippet, where = "";
      if (this.name) {
        where += 'in "' + this.name + '" ';
      }
      where += "at line " + (this.line + 1) + ", column " + (this.column + 1);
      if (!compact) {
        snippet = this.getSnippet();
        if (snippet) {
          where += ":\n" + snippet;
        }
      }
      return where;
    };
    module2.exports = Mark;
  }
});

// node_modules/js-yaml/lib/js-yaml/type.js
var require_type = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type.js"(exports, module2) {
    init_shims();
    "use strict";
    var YAMLException = require_exception();
    var TYPE_CONSTRUCTOR_OPTIONS = [
      "kind",
      "resolve",
      "construct",
      "instanceOf",
      "predicate",
      "represent",
      "defaultStyle",
      "styleAliases"
    ];
    var YAML_NODE_KINDS = [
      "scalar",
      "sequence",
      "mapping"
    ];
    function compileStyleAliases(map) {
      var result = {};
      if (map !== null) {
        Object.keys(map).forEach(function(style) {
          map[style].forEach(function(alias) {
            result[String(alias)] = style;
          });
        });
      }
      return result;
    }
    function Type(tag, options2) {
      options2 = options2 || {};
      Object.keys(options2).forEach(function(name) {
        if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
          throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        }
      });
      this.tag = tag;
      this.kind = options2["kind"] || null;
      this.resolve = options2["resolve"] || function() {
        return true;
      };
      this.construct = options2["construct"] || function(data) {
        return data;
      };
      this.instanceOf = options2["instanceOf"] || null;
      this.predicate = options2["predicate"] || null;
      this.represent = options2["represent"] || null;
      this.defaultStyle = options2["defaultStyle"] || null;
      this.styleAliases = compileStyleAliases(options2["styleAliases"] || null);
      if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
        throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
    }
    module2.exports = Type;
  }
});

// node_modules/js-yaml/lib/js-yaml/schema.js
var require_schema = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema.js"(exports, module2) {
    init_shims();
    "use strict";
    var common2 = require_common();
    var YAMLException = require_exception();
    var Type = require_type();
    function compileList(schema, name, result) {
      var exclude = [];
      schema.include.forEach(function(includedSchema) {
        result = compileList(includedSchema, name, result);
      });
      schema[name].forEach(function(currentType) {
        result.forEach(function(previousType, previousIndex) {
          if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
            exclude.push(previousIndex);
          }
        });
        result.push(currentType);
      });
      return result.filter(function(type, index2) {
        return exclude.indexOf(index2) === -1;
      });
    }
    function compileMap() {
      var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {}
      }, index2, length;
      function collectType(type) {
        result[type.kind][type.tag] = result["fallback"][type.tag] = type;
      }
      for (index2 = 0, length = arguments.length; index2 < length; index2 += 1) {
        arguments[index2].forEach(collectType);
      }
      return result;
    }
    function Schema(definition) {
      this.include = definition.include || [];
      this.implicit = definition.implicit || [];
      this.explicit = definition.explicit || [];
      this.implicit.forEach(function(type) {
        if (type.loadKind && type.loadKind !== "scalar") {
          throw new YAMLException("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
        }
      });
      this.compiledImplicit = compileList(this, "implicit", []);
      this.compiledExplicit = compileList(this, "explicit", []);
      this.compiledTypeMap = compileMap(this.compiledImplicit, this.compiledExplicit);
    }
    Schema.DEFAULT = null;
    Schema.create = function createSchema() {
      var schemas, types2;
      switch (arguments.length) {
        case 1:
          schemas = Schema.DEFAULT;
          types2 = arguments[0];
          break;
        case 2:
          schemas = arguments[0];
          types2 = arguments[1];
          break;
        default:
          throw new YAMLException("Wrong number of arguments for Schema.create function");
      }
      schemas = common2.toArray(schemas);
      types2 = common2.toArray(types2);
      if (!schemas.every(function(schema) {
        return schema instanceof Schema;
      })) {
        throw new YAMLException("Specified list of super schemas (or a single Schema object) contains a non-Schema object.");
      }
      if (!types2.every(function(type) {
        return type instanceof Type;
      })) {
        throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      return new Schema({
        include: schemas,
        explicit: types2
      });
    };
    module2.exports = Schema;
  }
});

// node_modules/js-yaml/lib/js-yaml/type/str.js
var require_str = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/str.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:str", {
      kind: "scalar",
      construct: function(data) {
        return data !== null ? data : "";
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/seq.js
var require_seq = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/seq.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:seq", {
      kind: "sequence",
      construct: function(data) {
        return data !== null ? data : [];
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/map.js
var require_map = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/map.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:map", {
      kind: "mapping",
      construct: function(data) {
        return data !== null ? data : {};
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/failsafe.js
var require_failsafe = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/failsafe.js"(exports, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      explicit: [
        require_str(),
        require_seq(),
        require_map()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/null.js
var require_null = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/null.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveYamlNull(data) {
      if (data === null)
        return true;
      var max = data.length;
      return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
    }
    function constructYamlNull() {
      return null;
    }
    function isNull(object) {
      return object === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:null", {
      kind: "scalar",
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function() {
          return "~";
        },
        lowercase: function() {
          return "null";
        },
        uppercase: function() {
          return "NULL";
        },
        camelcase: function() {
          return "Null";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/bool.js
var require_bool = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/bool.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveYamlBoolean(data) {
      if (data === null)
        return false;
      var max = data.length;
      return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
    }
    function constructYamlBoolean(data) {
      return data === "true" || data === "True" || data === "TRUE";
    }
    function isBoolean(object) {
      return Object.prototype.toString.call(object) === "[object Boolean]";
    }
    module2.exports = new Type("tag:yaml.org,2002:bool", {
      kind: "scalar",
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function(object) {
          return object ? "true" : "false";
        },
        uppercase: function(object) {
          return object ? "TRUE" : "FALSE";
        },
        camelcase: function(object) {
          return object ? "True" : "False";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/int.js
var require_int = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/int.js"(exports, module2) {
    init_shims();
    "use strict";
    var common2 = require_common();
    var Type = require_type();
    function isHexCode(c) {
      return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
    }
    function isOctCode(c) {
      return 48 <= c && c <= 55;
    }
    function isDecCode(c) {
      return 48 <= c && c <= 57;
    }
    function resolveYamlInteger(data) {
      if (data === null)
        return false;
      var max = data.length, index2 = 0, hasDigits = false, ch;
      if (!max)
        return false;
      ch = data[index2];
      if (ch === "-" || ch === "+") {
        ch = data[++index2];
      }
      if (ch === "0") {
        if (index2 + 1 === max)
          return true;
        ch = data[++index2];
        if (ch === "b") {
          index2++;
          for (; index2 < max; index2++) {
            ch = data[index2];
            if (ch === "_")
              continue;
            if (ch !== "0" && ch !== "1")
              return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        if (ch === "x") {
          index2++;
          for (; index2 < max; index2++) {
            ch = data[index2];
            if (ch === "_")
              continue;
            if (!isHexCode(data.charCodeAt(index2)))
              return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        for (; index2 < max; index2++) {
          ch = data[index2];
          if (ch === "_")
            continue;
          if (!isOctCode(data.charCodeAt(index2)))
            return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      if (ch === "_")
        return false;
      for (; index2 < max; index2++) {
        ch = data[index2];
        if (ch === "_")
          continue;
        if (ch === ":")
          break;
        if (!isDecCode(data.charCodeAt(index2))) {
          return false;
        }
        hasDigits = true;
      }
      if (!hasDigits || ch === "_")
        return false;
      if (ch !== ":")
        return true;
      return /^(:[0-5]?[0-9])+$/.test(data.slice(index2));
    }
    function constructYamlInteger(data) {
      var value = data, sign = 1, ch, base, digits = [];
      if (value.indexOf("_") !== -1) {
        value = value.replace(/_/g, "");
      }
      ch = value[0];
      if (ch === "-" || ch === "+") {
        if (ch === "-")
          sign = -1;
        value = value.slice(1);
        ch = value[0];
      }
      if (value === "0")
        return 0;
      if (ch === "0") {
        if (value[1] === "b")
          return sign * parseInt(value.slice(2), 2);
        if (value[1] === "x")
          return sign * parseInt(value, 16);
        return sign * parseInt(value, 8);
      }
      if (value.indexOf(":") !== -1) {
        value.split(":").forEach(function(v) {
          digits.unshift(parseInt(v, 10));
        });
        value = 0;
        base = 1;
        digits.forEach(function(d2) {
          value += d2 * base;
          base *= 60;
        });
        return sign * value;
      }
      return sign * parseInt(value, 10);
    }
    function isInteger(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common2.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:int", {
      kind: "scalar",
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary: function(obj) {
          return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
        },
        octal: function(obj) {
          return obj >= 0 ? "0" + obj.toString(8) : "-0" + obj.toString(8).slice(1);
        },
        decimal: function(obj) {
          return obj.toString(10);
        },
        hexadecimal: function(obj) {
          return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
        }
      },
      defaultStyle: "decimal",
      styleAliases: {
        binary: [2, "bin"],
        octal: [8, "oct"],
        decimal: [10, "dec"],
        hexadecimal: [16, "hex"]
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/float.js
var require_float = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/float.js"(exports, module2) {
    init_shims();
    "use strict";
    var common2 = require_common();
    var Type = require_type();
    var YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
    function resolveYamlFloat(data) {
      if (data === null)
        return false;
      if (!YAML_FLOAT_PATTERN.test(data) || data[data.length - 1] === "_") {
        return false;
      }
      return true;
    }
    function constructYamlFloat(data) {
      var value, sign, base, digits;
      value = data.replace(/_/g, "").toLowerCase();
      sign = value[0] === "-" ? -1 : 1;
      digits = [];
      if ("+-".indexOf(value[0]) >= 0) {
        value = value.slice(1);
      }
      if (value === ".inf") {
        return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      } else if (value === ".nan") {
        return NaN;
      } else if (value.indexOf(":") >= 0) {
        value.split(":").forEach(function(v) {
          digits.unshift(parseFloat(v, 10));
        });
        value = 0;
        base = 1;
        digits.forEach(function(d2) {
          value += d2 * base;
          base *= 60;
        });
        return sign * value;
      }
      return sign * parseFloat(value, 10);
    }
    var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
    function representYamlFloat(object, style) {
      var res;
      if (isNaN(object)) {
        switch (style) {
          case "lowercase":
            return ".nan";
          case "uppercase":
            return ".NAN";
          case "camelcase":
            return ".NaN";
        }
      } else if (Number.POSITIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return ".inf";
          case "uppercase":
            return ".INF";
          case "camelcase":
            return ".Inf";
        }
      } else if (Number.NEGATIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return "-.inf";
          case "uppercase":
            return "-.INF";
          case "camelcase":
            return "-.Inf";
        }
      } else if (common2.isNegativeZero(object)) {
        return "-0.0";
      }
      res = object.toString(10);
      return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
    }
    function isFloat(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:float", {
      kind: "scalar",
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/json.js
var require_json = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/json.js"(exports, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_failsafe()
      ],
      implicit: [
        require_null(),
        require_bool(),
        require_int(),
        require_float()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/core.js
var require_core = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/core.js"(exports, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_json()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/timestamp.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    var YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
    var YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
    function resolveYamlTimestamp(data) {
      if (data === null)
        return false;
      if (YAML_DATE_REGEXP.exec(data) !== null)
        return true;
      if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
        return true;
      return false;
    }
    function constructYamlTimestamp(data) {
      var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
      match = YAML_DATE_REGEXP.exec(data);
      if (match === null)
        match = YAML_TIMESTAMP_REGEXP.exec(data);
      if (match === null)
        throw new Error("Date resolve error");
      year = +match[1];
      month = +match[2] - 1;
      day = +match[3];
      if (!match[4]) {
        return new Date(Date.UTC(year, month, day));
      }
      hour = +match[4];
      minute = +match[5];
      second = +match[6];
      if (match[7]) {
        fraction = match[7].slice(0, 3);
        while (fraction.length < 3) {
          fraction += "0";
        }
        fraction = +fraction;
      }
      if (match[9]) {
        tz_hour = +match[10];
        tz_minute = +(match[11] || 0);
        delta = (tz_hour * 60 + tz_minute) * 6e4;
        if (match[9] === "-")
          delta = -delta;
      }
      date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
      if (delta)
        date.setTime(date.getTime() - delta);
      return date;
    }
    function representYamlTimestamp(object) {
      return object.toISOString();
    }
    module2.exports = new Type("tag:yaml.org,2002:timestamp", {
      kind: "scalar",
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/merge.js
var require_merge = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/merge.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveYamlMerge(data) {
      return data === "<<" || data === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:merge", {
      kind: "scalar",
      resolve: resolveYamlMerge
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/binary.js
var require_binary = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/binary.js"(exports, module2) {
    init_shims();
    "use strict";
    var NodeBuffer;
    try {
      _require = require;
      NodeBuffer = _require("buffer").Buffer;
    } catch (__) {
    }
    var _require;
    var Type = require_type();
    var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
    function resolveYamlBinary(data) {
      if (data === null)
        return false;
      var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        code = map.indexOf(data.charAt(idx));
        if (code > 64)
          continue;
        if (code < 0)
          return false;
        bitlen += 6;
      }
      return bitlen % 8 === 0;
    }
    function constructYamlBinary(data) {
      var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map = BASE64_MAP, bits = 0, result = [];
      for (idx = 0; idx < max; idx++) {
        if (idx % 4 === 0 && idx) {
          result.push(bits >> 16 & 255);
          result.push(bits >> 8 & 255);
          result.push(bits & 255);
        }
        bits = bits << 6 | map.indexOf(input.charAt(idx));
      }
      tailbits = max % 4 * 6;
      if (tailbits === 0) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      } else if (tailbits === 18) {
        result.push(bits >> 10 & 255);
        result.push(bits >> 2 & 255);
      } else if (tailbits === 12) {
        result.push(bits >> 4 & 255);
      }
      if (NodeBuffer) {
        return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
      }
      return result;
    }
    function representYamlBinary(object) {
      var result = "", bits = 0, idx, tail, max = object.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        if (idx % 3 === 0 && idx) {
          result += map[bits >> 18 & 63];
          result += map[bits >> 12 & 63];
          result += map[bits >> 6 & 63];
          result += map[bits & 63];
        }
        bits = (bits << 8) + object[idx];
      }
      tail = max % 3;
      if (tail === 0) {
        result += map[bits >> 18 & 63];
        result += map[bits >> 12 & 63];
        result += map[bits >> 6 & 63];
        result += map[bits & 63];
      } else if (tail === 2) {
        result += map[bits >> 10 & 63];
        result += map[bits >> 4 & 63];
        result += map[bits << 2 & 63];
        result += map[64];
      } else if (tail === 1) {
        result += map[bits >> 2 & 63];
        result += map[bits << 4 & 63];
        result += map[64];
        result += map[64];
      }
      return result;
    }
    function isBinary(object) {
      return NodeBuffer && NodeBuffer.isBuffer(object);
    }
    module2.exports = new Type("tag:yaml.org,2002:binary", {
      kind: "scalar",
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/omap.js
var require_omap = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/omap.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var _toString = Object.prototype.toString;
    function resolveYamlOmap(data) {
      if (data === null)
        return true;
      var objectKeys = [], index2, length, pair, pairKey, pairHasKey, object = data;
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        pair = object[index2];
        pairHasKey = false;
        if (_toString.call(pair) !== "[object Object]")
          return false;
        for (pairKey in pair) {
          if (_hasOwnProperty.call(pair, pairKey)) {
            if (!pairHasKey)
              pairHasKey = true;
            else
              return false;
          }
        }
        if (!pairHasKey)
          return false;
        if (objectKeys.indexOf(pairKey) === -1)
          objectKeys.push(pairKey);
        else
          return false;
      }
      return true;
    }
    function constructYamlOmap(data) {
      return data !== null ? data : [];
    }
    module2.exports = new Type("tag:yaml.org,2002:omap", {
      kind: "sequence",
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/pairs.js
var require_pairs = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/pairs.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    var _toString = Object.prototype.toString;
    function resolveYamlPairs(data) {
      if (data === null)
        return true;
      var index2, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        pair = object[index2];
        if (_toString.call(pair) !== "[object Object]")
          return false;
        keys = Object.keys(pair);
        if (keys.length !== 1)
          return false;
        result[index2] = [keys[0], pair[keys[0]]];
      }
      return true;
    }
    function constructYamlPairs(data) {
      if (data === null)
        return [];
      var index2, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        pair = object[index2];
        keys = Object.keys(pair);
        result[index2] = [keys[0], pair[keys[0]]];
      }
      return result;
    }
    module2.exports = new Type("tag:yaml.org,2002:pairs", {
      kind: "sequence",
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/set.js
var require_set = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/set.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    function resolveYamlSet(data) {
      if (data === null)
        return true;
      var key, object = data;
      for (key in object) {
        if (_hasOwnProperty.call(object, key)) {
          if (object[key] !== null)
            return false;
        }
      }
      return true;
    }
    function constructYamlSet(data) {
      return data !== null ? data : {};
    }
    module2.exports = new Type("tag:yaml.org,2002:set", {
      kind: "mapping",
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/default_safe.js
var require_default_safe = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/default_safe.js"(exports, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_core()
      ],
      implicit: [
        require_timestamp(),
        require_merge()
      ],
      explicit: [
        require_binary(),
        require_omap(),
        require_pairs(),
        require_set()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/undefined.js
var require_undefined = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/undefined.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveJavascriptUndefined() {
      return true;
    }
    function constructJavascriptUndefined() {
      return void 0;
    }
    function representJavascriptUndefined() {
      return "";
    }
    function isUndefined(object) {
      return typeof object === "undefined";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/undefined", {
      kind: "scalar",
      resolve: resolveJavascriptUndefined,
      construct: constructJavascriptUndefined,
      predicate: isUndefined,
      represent: representJavascriptUndefined
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/regexp.js
var require_regexp = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/regexp.js"(exports, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveJavascriptRegExp(data) {
      if (data === null)
        return false;
      if (data.length === 0)
        return false;
      var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
      if (regexp[0] === "/") {
        if (tail)
          modifiers = tail[1];
        if (modifiers.length > 3)
          return false;
        if (regexp[regexp.length - modifiers.length - 1] !== "/")
          return false;
      }
      return true;
    }
    function constructJavascriptRegExp(data) {
      var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
      if (regexp[0] === "/") {
        if (tail)
          modifiers = tail[1];
        regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
      }
      return new RegExp(regexp, modifiers);
    }
    function representJavascriptRegExp(object) {
      var result = "/" + object.source + "/";
      if (object.global)
        result += "g";
      if (object.multiline)
        result += "m";
      if (object.ignoreCase)
        result += "i";
      return result;
    }
    function isRegExp(object) {
      return Object.prototype.toString.call(object) === "[object RegExp]";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/regexp", {
      kind: "scalar",
      resolve: resolveJavascriptRegExp,
      construct: constructJavascriptRegExp,
      predicate: isRegExp,
      represent: representJavascriptRegExp
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/function.js
var require_function = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/function.js"(exports, module2) {
    init_shims();
    "use strict";
    var esprima;
    try {
      _require = require;
      esprima = _require("esprima");
    } catch (_) {
      if (typeof window !== "undefined")
        esprima = window.esprima;
    }
    var _require;
    var Type = require_type();
    function resolveJavascriptFunction(data) {
      if (data === null)
        return false;
      try {
        var source = "(" + data + ")", ast = esprima.parse(source, { range: true });
        if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
    function constructJavascriptFunction(data) {
      var source = "(" + data + ")", ast = esprima.parse(source, { range: true }), params = [], body;
      if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") {
        throw new Error("Failed to resolve function");
      }
      ast.body[0].expression.params.forEach(function(param) {
        params.push(param.name);
      });
      body = ast.body[0].expression.body.range;
      if (ast.body[0].expression.body.type === "BlockStatement") {
        return new Function(params, source.slice(body[0] + 1, body[1] - 1));
      }
      return new Function(params, "return " + source.slice(body[0], body[1]));
    }
    function representJavascriptFunction(object) {
      return object.toString();
    }
    function isFunction(object) {
      return Object.prototype.toString.call(object) === "[object Function]";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/function", {
      kind: "scalar",
      resolve: resolveJavascriptFunction,
      construct: constructJavascriptFunction,
      predicate: isFunction,
      represent: representJavascriptFunction
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/default_full.js
var require_default_full = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/default_full.js"(exports, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = Schema.DEFAULT = new Schema({
      include: [
        require_default_safe()
      ],
      explicit: [
        require_undefined(),
        require_regexp(),
        require_function()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/loader.js
var require_loader = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/loader.js"(exports, module2) {
    init_shims();
    "use strict";
    var common2 = require_common();
    var YAMLException = require_exception();
    var Mark = require_mark();
    var DEFAULT_SAFE_SCHEMA = require_default_safe();
    var DEFAULT_FULL_SCHEMA = require_default_full();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CONTEXT_FLOW_IN = 1;
    var CONTEXT_FLOW_OUT = 2;
    var CONTEXT_BLOCK_IN = 3;
    var CONTEXT_BLOCK_OUT = 4;
    var CHOMPING_CLIP = 1;
    var CHOMPING_STRIP = 2;
    var CHOMPING_KEEP = 3;
    var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
    var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
    var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
    function _class(obj) {
      return Object.prototype.toString.call(obj);
    }
    function is_EOL(c) {
      return c === 10 || c === 13;
    }
    function is_WHITE_SPACE(c) {
      return c === 9 || c === 32;
    }
    function is_WS_OR_EOL(c) {
      return c === 9 || c === 32 || c === 10 || c === 13;
    }
    function is_FLOW_INDICATOR(c) {
      return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
    }
    function fromHexCode(c) {
      var lc;
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      lc = c | 32;
      if (97 <= lc && lc <= 102) {
        return lc - 97 + 10;
      }
      return -1;
    }
    function escapedHexLen(c) {
      if (c === 120) {
        return 2;
      }
      if (c === 117) {
        return 4;
      }
      if (c === 85) {
        return 8;
      }
      return 0;
    }
    function fromDecimalCode(c) {
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      return -1;
    }
    function simpleEscapeSequence(c) {
      return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
    }
    function charFromCodepoint(c) {
      if (c <= 65535) {
        return String.fromCharCode(c);
      }
      return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
    }
    var simpleEscapeCheck = new Array(256);
    var simpleEscapeMap = new Array(256);
    for (var i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }
    function State(input, options2) {
      this.input = input;
      this.filename = options2["filename"] || null;
      this.schema = options2["schema"] || DEFAULT_FULL_SCHEMA;
      this.onWarning = options2["onWarning"] || null;
      this.legacy = options2["legacy"] || false;
      this.json = options2["json"] || false;
      this.listener = options2["listener"] || null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.typeMap = this.schema.compiledTypeMap;
      this.length = input.length;
      this.position = 0;
      this.line = 0;
      this.lineStart = 0;
      this.lineIndent = 0;
      this.documents = [];
    }
    function generateError(state, message) {
      return new YAMLException(message, new Mark(state.filename, state.input, state.position, state.line, state.position - state.lineStart));
    }
    function throwError(state, message) {
      throw generateError(state, message);
    }
    function throwWarning(state, message) {
      if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
      }
    }
    var directiveHandlers = {
      YAML: function handleYamlDirective(state, name, args) {
        var match, major, minor;
        if (state.version !== null) {
          throwError(state, "duplication of %YAML directive");
        }
        if (args.length !== 1) {
          throwError(state, "YAML directive accepts exactly one argument");
        }
        match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
        if (match === null) {
          throwError(state, "ill-formed argument of the YAML directive");
        }
        major = parseInt(match[1], 10);
        minor = parseInt(match[2], 10);
        if (major !== 1) {
          throwError(state, "unacceptable YAML version of the document");
        }
        state.version = args[0];
        state.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
          throwWarning(state, "unsupported YAML version of the document");
        }
      },
      TAG: function handleTagDirective(state, name, args) {
        var handle, prefix;
        if (args.length !== 2) {
          throwError(state, "TAG directive accepts exactly two arguments");
        }
        handle = args[0];
        prefix = args[1];
        if (!PATTERN_TAG_HANDLE.test(handle)) {
          throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (_hasOwnProperty.call(state.tagMap, handle)) {
          throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        state.tagMap[handle] = prefix;
      }
    };
    function captureSegment(state, start, end, checkJson) {
      var _position, _length, _character, _result;
      if (start < end) {
        _result = state.input.slice(start, end);
        if (checkJson) {
          for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
            _character = _result.charCodeAt(_position);
            if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
              throwError(state, "expected valid JSON character");
            }
          }
        } else if (PATTERN_NON_PRINTABLE.test(_result)) {
          throwError(state, "the stream contains non-printable characters");
        }
        state.result += _result;
      }
    }
    function mergeMappings(state, destination, source, overridableKeys) {
      var sourceKeys, key, index2, quantity;
      if (!common2.isObject(source)) {
        throwError(state, "cannot merge mappings; the provided source object is unacceptable");
      }
      sourceKeys = Object.keys(source);
      for (index2 = 0, quantity = sourceKeys.length; index2 < quantity; index2 += 1) {
        key = sourceKeys[index2];
        if (!_hasOwnProperty.call(destination, key)) {
          destination[key] = source[key];
          overridableKeys[key] = true;
        }
      }
    }
    function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
      var index2, quantity;
      if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);
        for (index2 = 0, quantity = keyNode.length; index2 < quantity; index2 += 1) {
          if (Array.isArray(keyNode[index2])) {
            throwError(state, "nested arrays are not supported inside keys");
          }
          if (typeof keyNode === "object" && _class(keyNode[index2]) === "[object Object]") {
            keyNode[index2] = "[object Object]";
          }
        }
      }
      if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
        keyNode = "[object Object]";
      }
      keyNode = String(keyNode);
      if (_result === null) {
        _result = {};
      }
      if (keyTag === "tag:yaml.org,2002:merge") {
        if (Array.isArray(valueNode)) {
          for (index2 = 0, quantity = valueNode.length; index2 < quantity; index2 += 1) {
            mergeMappings(state, _result, valueNode[index2], overridableKeys);
          }
        } else {
          mergeMappings(state, _result, valueNode, overridableKeys);
        }
      } else {
        if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
          state.line = startLine || state.line;
          state.position = startPos || state.position;
          throwError(state, "duplicated mapping key");
        }
        _result[keyNode] = valueNode;
        delete overridableKeys[keyNode];
      }
      return _result;
    }
    function readLineBreak(state) {
      var ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 10) {
        state.position++;
      } else if (ch === 13) {
        state.position++;
        if (state.input.charCodeAt(state.position) === 10) {
          state.position++;
        }
      } else {
        throwError(state, "a line break is expected");
      }
      state.line += 1;
      state.lineStart = state.position;
    }
    function skipSeparationSpace(state, allowComments, checkIndent) {
      var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (allowComments && ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 10 && ch !== 13 && ch !== 0);
        }
        if (is_EOL(ch)) {
          readLineBreak(state);
          ch = state.input.charCodeAt(state.position);
          lineBreaks++;
          state.lineIndent = 0;
          while (ch === 32) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
        } else {
          break;
        }
      }
      if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, "deficient indentation");
      }
      return lineBreaks;
    }
    function testDocumentSeparator(state) {
      var _position = state.position, ch;
      ch = state.input.charCodeAt(_position);
      if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state.input.charCodeAt(_position);
        if (ch === 0 || is_WS_OR_EOL(ch)) {
          return true;
        }
      }
      return false;
    }
    function writeFoldedLines(state, count) {
      if (count === 1) {
        state.result += " ";
      } else if (count > 1) {
        state.result += common2.repeat("\n", count - 1);
      }
    }
    function readPlainScalar(state, nodeIndent, withinFlowCollection) {
      var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
      ch = state.input.charCodeAt(state.position);
      if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
        return false;
      }
      if (ch === 63 || ch === 45) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
          return false;
        }
      }
      state.kind = "scalar";
      state.result = "";
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
      while (ch !== 0) {
        if (ch === 58) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
            break;
          }
        } else if (ch === 35) {
          preceding = state.input.charCodeAt(state.position - 1);
          if (is_WS_OR_EOL(preceding)) {
            break;
          }
        } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
          break;
        } else if (is_EOL(ch)) {
          _line = state.line;
          _lineStart = state.lineStart;
          _lineIndent = state.lineIndent;
          skipSeparationSpace(state, false, -1);
          if (state.lineIndent >= nodeIndent) {
            hasPendingContent = true;
            ch = state.input.charCodeAt(state.position);
            continue;
          } else {
            state.position = captureEnd;
            state.line = _line;
            state.lineStart = _lineStart;
            state.lineIndent = _lineIndent;
            break;
          }
        }
        if (hasPendingContent) {
          captureSegment(state, captureStart, captureEnd, false);
          writeFoldedLines(state, state.line - _line);
          captureStart = captureEnd = state.position;
          hasPendingContent = false;
        }
        if (!is_WHITE_SPACE(ch)) {
          captureEnd = state.position + 1;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, captureEnd, false);
      if (state.result) {
        return true;
      }
      state.kind = _kind;
      state.result = _result;
      return false;
    }
    function readSingleQuotedScalar(state, nodeIndent) {
      var ch, captureStart, captureEnd;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 39) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 39) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (ch === 39) {
            captureStart = state.position;
            state.position++;
            captureEnd = state.position;
          } else {
            return true;
          }
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a single quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a single quoted scalar");
    }
    function readDoubleQuotedScalar(state, nodeIndent) {
      var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 34) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 34) {
          captureSegment(state, captureStart, state.position, true);
          state.position++;
          return true;
        } else if (ch === 92) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (is_EOL(ch)) {
            skipSeparationSpace(state, false, nodeIndent);
          } else if (ch < 256 && simpleEscapeCheck[ch]) {
            state.result += simpleEscapeMap[ch];
            state.position++;
          } else if ((tmp = escapedHexLen(ch)) > 0) {
            hexLength = tmp;
            hexResult = 0;
            for (; hexLength > 0; hexLength--) {
              ch = state.input.charCodeAt(++state.position);
              if ((tmp = fromHexCode(ch)) >= 0) {
                hexResult = (hexResult << 4) + tmp;
              } else {
                throwError(state, "expected hexadecimal character");
              }
            }
            state.result += charFromCodepoint(hexResult);
            state.position++;
          } else {
            throwError(state, "unknown escape sequence");
          }
          captureStart = captureEnd = state.position;
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a double quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a double quoted scalar");
    }
    function readFlowCollection(state, nodeIndent) {
      var readNext = true, _line, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = {}, keyNode, keyTag, valueNode, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 91) {
        terminator = 93;
        isMapping = false;
        _result = [];
      } else if (ch === 123) {
        terminator = 125;
        isMapping = true;
        _result = {};
      } else {
        return false;
      }
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(++state.position);
      while (ch !== 0) {
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === terminator) {
          state.position++;
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = isMapping ? "mapping" : "sequence";
          state.result = _result;
          return true;
        } else if (!readNext) {
          throwError(state, "missed comma between flow collection entries");
        }
        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;
        if (ch === 63) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following)) {
            isPair = isExplicitPair = true;
            state.position++;
            skipSeparationSpace(state, true, nodeIndent);
          }
        }
        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if ((isExplicitPair || state.line === _line) && ch === 58) {
          isPair = true;
          ch = state.input.charCodeAt(++state.position);
          skipSeparationSpace(state, true, nodeIndent);
          composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
          valueNode = state.result;
        }
        if (isMapping) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
        } else if (isPair) {
          _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
        } else {
          _result.push(keyNode);
        }
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === 44) {
          readNext = true;
          ch = state.input.charCodeAt(++state.position);
        } else {
          readNext = false;
        }
      }
      throwError(state, "unexpected end of the stream within a flow collection");
    }
    function readBlockScalar(state, nodeIndent) {
      var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 124) {
        folding = false;
      } else if (ch === 62) {
        folding = true;
      } else {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      while (ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
        if (ch === 43 || ch === 45) {
          if (CHOMPING_CLIP === chomping) {
            chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
          } else {
            throwError(state, "repeat of a chomping mode identifier");
          }
        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
          if (tmp === 0) {
            throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
          } else if (!detectedIndent) {
            textIndent = nodeIndent + tmp - 1;
            detectedIndent = true;
          } else {
            throwError(state, "repeat of an indentation width identifier");
          }
        } else {
          break;
        }
      }
      if (is_WHITE_SPACE(ch)) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (is_WHITE_SPACE(ch));
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (!is_EOL(ch) && ch !== 0);
        }
      }
      while (ch !== 0) {
        readLineBreak(state);
        state.lineIndent = 0;
        ch = state.input.charCodeAt(state.position);
        while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
        if (!detectedIndent && state.lineIndent > textIndent) {
          textIndent = state.lineIndent;
        }
        if (is_EOL(ch)) {
          emptyLines++;
          continue;
        }
        if (state.lineIndent < textIndent) {
          if (chomping === CHOMPING_KEEP) {
            state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (chomping === CHOMPING_CLIP) {
            if (didReadContent) {
              state.result += "\n";
            }
          }
          break;
        }
        if (folding) {
          if (is_WHITE_SPACE(ch)) {
            atMoreIndented = true;
            state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (atMoreIndented) {
            atMoreIndented = false;
            state.result += common2.repeat("\n", emptyLines + 1);
          } else if (emptyLines === 0) {
            if (didReadContent) {
              state.result += " ";
            }
          } else {
            state.result += common2.repeat("\n", emptyLines);
          }
        } else {
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        }
        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        captureStart = state.position;
        while (!is_EOL(ch) && ch !== 0) {
          ch = state.input.charCodeAt(++state.position);
        }
        captureSegment(state, captureStart, state.position, false);
      }
      return true;
    }
    function readBlockSequence(state, nodeIndent) {
      var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (ch !== 45) {
          break;
        }
        following = state.input.charCodeAt(state.position + 1);
        if (!is_WS_OR_EOL(following)) {
          break;
        }
        detected = true;
        state.position++;
        if (skipSeparationSpace(state, true, -1)) {
          if (state.lineIndent <= nodeIndent) {
            _result.push(null);
            ch = state.input.charCodeAt(state.position);
            continue;
          }
        }
        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
        _result.push(state.result);
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a sequence entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "sequence";
        state.result = _result;
        return true;
      }
      return false;
    }
    function readBlockMapping(state, nodeIndent, flowIndent) {
      var following, allowCompact, _line, _pos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = {}, keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        following = state.input.charCodeAt(state.position + 1);
        _line = state.line;
        _pos = state.position;
        if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
          if (ch === 63) {
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = true;
            allowCompact = true;
          } else if (atExplicitKey) {
            atExplicitKey = false;
            allowCompact = true;
          } else {
            throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
          }
          state.position += 1;
          ch = following;
        } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          if (state.line === _line) {
            ch = state.input.charCodeAt(state.position);
            while (is_WHITE_SPACE(ch)) {
              ch = state.input.charCodeAt(++state.position);
            }
            if (ch === 58) {
              ch = state.input.charCodeAt(++state.position);
              if (!is_WS_OR_EOL(ch)) {
                throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
              }
              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
                keyTag = keyNode = valueNode = null;
              }
              detected = true;
              atExplicitKey = false;
              allowCompact = false;
              keyTag = state.tag;
              keyNode = state.result;
            } else if (detected) {
              throwError(state, "can not read an implicit mapping pair; a colon is missed");
            } else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true;
            }
          } else if (detected) {
            throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else {
          break;
        }
        if (state.line === _line || state.lineIndent > nodeIndent) {
          if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
            if (atExplicitKey) {
              keyNode = state.result;
            } else {
              valueNode = state.result;
            }
          }
          if (!atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
            keyTag = keyNode = valueNode = null;
          }
          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
        }
        if (state.lineIndent > nodeIndent && ch !== 0) {
          throwError(state, "bad indentation of a mapping entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "mapping";
        state.result = _result;
      }
      return detected;
    }
    function readTagProperty(state) {
      var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 33)
        return false;
      if (state.tag !== null) {
        throwError(state, "duplication of a tag property");
      }
      ch = state.input.charCodeAt(++state.position);
      if (ch === 60) {
        isVerbatim = true;
        ch = state.input.charCodeAt(++state.position);
      } else if (ch === 33) {
        isNamed = true;
        tagHandle = "!!";
        ch = state.input.charCodeAt(++state.position);
      } else {
        tagHandle = "!";
      }
      _position = state.position;
      if (isVerbatim) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && ch !== 62);
        if (state.position < state.length) {
          tagName = state.input.slice(_position, state.position);
          ch = state.input.charCodeAt(++state.position);
        } else {
          throwError(state, "unexpected end of the stream within a verbatim tag");
        }
      } else {
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          if (ch === 33) {
            if (!isNamed) {
              tagHandle = state.input.slice(_position - 1, state.position + 1);
              if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                throwError(state, "named tag handle cannot contain such characters");
              }
              isNamed = true;
              _position = state.position + 1;
            } else {
              throwError(state, "tag suffix cannot contain exclamation marks");
            }
          }
          ch = state.input.charCodeAt(++state.position);
        }
        tagName = state.input.slice(_position, state.position);
        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
          throwError(state, "tag suffix cannot contain flow indicator characters");
        }
      }
      if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        throwError(state, "tag name cannot contain such characters: " + tagName);
      }
      if (isVerbatim) {
        state.tag = tagName;
      } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;
      } else if (tagHandle === "!") {
        state.tag = "!" + tagName;
      } else if (tagHandle === "!!") {
        state.tag = "tag:yaml.org,2002:" + tagName;
      } else {
        throwError(state, 'undeclared tag handle "' + tagHandle + '"');
      }
      return true;
    }
    function readAnchorProperty(state) {
      var _position, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 38)
        return false;
      if (state.anchor !== null) {
        throwError(state, "duplication of an anchor property");
      }
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an anchor node must contain at least one character");
      }
      state.anchor = state.input.slice(_position, state.position);
      return true;
    }
    function readAlias(state) {
      var _position, alias, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 42)
        return false;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an alias node must contain at least one character");
      }
      alias = state.input.slice(_position, state.position);
      if (!_hasOwnProperty.call(state.anchorMap, alias)) {
        throwError(state, 'unidentified alias "' + alias + '"');
      }
      state.result = state.anchorMap[alias];
      skipSeparationSpace(state, true, -1);
      return true;
    }
    function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
      var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, type, flowIndent, blockIndent;
      if (state.listener !== null) {
        state.listener("open", state);
      }
      state.tag = null;
      state.anchor = null;
      state.kind = null;
      state.result = null;
      allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
      if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        }
      }
      if (indentStatus === 1) {
        while (readTagProperty(state) || readAnchorProperty(state)) {
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            allowBlockCollections = allowBlockStyles;
            if (state.lineIndent > parentIndent) {
              indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
              indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
              indentStatus = -1;
            }
          } else {
            allowBlockCollections = false;
          }
        }
      }
      if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
      }
      if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
          flowIndent = parentIndent;
        } else {
          flowIndent = parentIndent + 1;
        }
        blockIndent = state.position - state.lineStart;
        if (indentStatus === 1) {
          if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
            hasContent = true;
          } else {
            if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
              hasContent = true;
            } else if (readAlias(state)) {
              hasContent = true;
              if (state.tag !== null || state.anchor !== null) {
                throwError(state, "alias node should not have any properties");
              }
            } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
              hasContent = true;
              if (state.tag === null) {
                state.tag = "?";
              }
            }
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else if (indentStatus === 0) {
          hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
      }
      if (state.tag !== null && state.tag !== "!") {
        if (state.tag === "?") {
          if (state.result !== null && state.kind !== "scalar") {
            throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
          }
          for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
            type = state.implicitTypes[typeIndex];
            if (type.resolve(state.result)) {
              state.result = type.construct(state.result);
              state.tag = type.tag;
              if (state.anchor !== null) {
                state.anchorMap[state.anchor] = state.result;
              }
              break;
            }
          }
        } else if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
          type = state.typeMap[state.kind || "fallback"][state.tag];
          if (state.result !== null && type.kind !== state.kind) {
            throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
          }
          if (!type.resolve(state.result)) {
            throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
          } else {
            state.result = type.construct(state.result);
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else {
          throwError(state, "unknown tag !<" + state.tag + ">");
        }
      }
      if (state.listener !== null) {
        state.listener("close", state);
      }
      return state.tag !== null || state.anchor !== null || hasContent;
    }
    function readDocument(state) {
      var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
      state.version = null;
      state.checkLineBreaks = state.legacy;
      state.tagMap = {};
      state.anchorMap = {};
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if (state.lineIndent > 0 || ch !== 37) {
          break;
        }
        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        _position = state.position;
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveName = state.input.slice(_position, state.position);
        directiveArgs = [];
        if (directiveName.length < 1) {
          throwError(state, "directive name must not be less than one character in length");
        }
        while (ch !== 0) {
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 35) {
            do {
              ch = state.input.charCodeAt(++state.position);
            } while (ch !== 0 && !is_EOL(ch));
            break;
          }
          if (is_EOL(ch))
            break;
          _position = state.position;
          while (ch !== 0 && !is_WS_OR_EOL(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          directiveArgs.push(state.input.slice(_position, state.position));
        }
        if (ch !== 0)
          readLineBreak(state);
        if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
          directiveHandlers[directiveName](state, directiveName, directiveArgs);
        } else {
          throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
      }
      skipSeparationSpace(state, true, -1);
      if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      } else if (hasDirectives) {
        throwError(state, "directives end mark is expected");
      }
      composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
      skipSeparationSpace(state, true, -1);
      if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, "non-ASCII line breaks are interpreted as content");
      }
      state.documents.push(state.result);
      if (state.position === state.lineStart && testDocumentSeparator(state)) {
        if (state.input.charCodeAt(state.position) === 46) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        }
        return;
      }
      if (state.position < state.length - 1) {
        throwError(state, "end of the stream or a document separator is expected");
      } else {
        return;
      }
    }
    function loadDocuments(input, options2) {
      input = String(input);
      options2 = options2 || {};
      if (input.length !== 0) {
        if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
          input += "\n";
        }
        if (input.charCodeAt(0) === 65279) {
          input = input.slice(1);
        }
      }
      var state = new State(input, options2);
      var nullpos = input.indexOf("\0");
      if (nullpos !== -1) {
        state.position = nullpos;
        throwError(state, "null byte is not allowed in input");
      }
      state.input += "\0";
      while (state.input.charCodeAt(state.position) === 32) {
        state.lineIndent += 1;
        state.position += 1;
      }
      while (state.position < state.length - 1) {
        readDocument(state);
      }
      return state.documents;
    }
    function loadAll(input, iterator, options2) {
      if (iterator !== null && typeof iterator === "object" && typeof options2 === "undefined") {
        options2 = iterator;
        iterator = null;
      }
      var documents = loadDocuments(input, options2);
      if (typeof iterator !== "function") {
        return documents;
      }
      for (var index2 = 0, length = documents.length; index2 < length; index2 += 1) {
        iterator(documents[index2]);
      }
    }
    function load2(input, options2) {
      var documents = loadDocuments(input, options2);
      if (documents.length === 0) {
        return void 0;
      } else if (documents.length === 1) {
        return documents[0];
      }
      throw new YAMLException("expected a single document in the stream, but found more");
    }
    function safeLoadAll(input, iterator, options2) {
      if (typeof iterator === "object" && iterator !== null && typeof options2 === "undefined") {
        options2 = iterator;
        iterator = null;
      }
      return loadAll(input, iterator, common2.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    function safeLoad(input, options2) {
      return load2(input, common2.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    module2.exports.loadAll = loadAll;
    module2.exports.load = load2;
    module2.exports.safeLoadAll = safeLoadAll;
    module2.exports.safeLoad = safeLoad;
  }
});

// node_modules/js-yaml/lib/js-yaml/dumper.js
var require_dumper = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/dumper.js"(exports, module2) {
    init_shims();
    "use strict";
    var common2 = require_common();
    var YAMLException = require_exception();
    var DEFAULT_FULL_SCHEMA = require_default_full();
    var DEFAULT_SAFE_SCHEMA = require_default_safe();
    var _toString = Object.prototype.toString;
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CHAR_TAB = 9;
    var CHAR_LINE_FEED = 10;
    var CHAR_CARRIAGE_RETURN = 13;
    var CHAR_SPACE = 32;
    var CHAR_EXCLAMATION = 33;
    var CHAR_DOUBLE_QUOTE = 34;
    var CHAR_SHARP = 35;
    var CHAR_PERCENT = 37;
    var CHAR_AMPERSAND = 38;
    var CHAR_SINGLE_QUOTE = 39;
    var CHAR_ASTERISK = 42;
    var CHAR_COMMA = 44;
    var CHAR_MINUS = 45;
    var CHAR_COLON = 58;
    var CHAR_EQUALS = 61;
    var CHAR_GREATER_THAN = 62;
    var CHAR_QUESTION = 63;
    var CHAR_COMMERCIAL_AT = 64;
    var CHAR_LEFT_SQUARE_BRACKET = 91;
    var CHAR_RIGHT_SQUARE_BRACKET = 93;
    var CHAR_GRAVE_ACCENT = 96;
    var CHAR_LEFT_CURLY_BRACKET = 123;
    var CHAR_VERTICAL_LINE = 124;
    var CHAR_RIGHT_CURLY_BRACKET = 125;
    var ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0] = "\\0";
    ESCAPE_SEQUENCES[7] = "\\a";
    ESCAPE_SEQUENCES[8] = "\\b";
    ESCAPE_SEQUENCES[9] = "\\t";
    ESCAPE_SEQUENCES[10] = "\\n";
    ESCAPE_SEQUENCES[11] = "\\v";
    ESCAPE_SEQUENCES[12] = "\\f";
    ESCAPE_SEQUENCES[13] = "\\r";
    ESCAPE_SEQUENCES[27] = "\\e";
    ESCAPE_SEQUENCES[34] = '\\"';
    ESCAPE_SEQUENCES[92] = "\\\\";
    ESCAPE_SEQUENCES[133] = "\\N";
    ESCAPE_SEQUENCES[160] = "\\_";
    ESCAPE_SEQUENCES[8232] = "\\L";
    ESCAPE_SEQUENCES[8233] = "\\P";
    var DEPRECATED_BOOLEANS_SYNTAX = [
      "y",
      "Y",
      "yes",
      "Yes",
      "YES",
      "on",
      "On",
      "ON",
      "n",
      "N",
      "no",
      "No",
      "NO",
      "off",
      "Off",
      "OFF"
    ];
    function compileStyleMap(schema, map) {
      var result, keys, index2, length, tag, style, type;
      if (map === null)
        return {};
      result = {};
      keys = Object.keys(map);
      for (index2 = 0, length = keys.length; index2 < length; index2 += 1) {
        tag = keys[index2];
        style = String(map[tag]);
        if (tag.slice(0, 2) === "!!") {
          tag = "tag:yaml.org,2002:" + tag.slice(2);
        }
        type = schema.compiledTypeMap["fallback"][tag];
        if (type && _hasOwnProperty.call(type.styleAliases, style)) {
          style = type.styleAliases[style];
        }
        result[tag] = style;
      }
      return result;
    }
    function encodeHex(character) {
      var string, handle, length;
      string = character.toString(16).toUpperCase();
      if (character <= 255) {
        handle = "x";
        length = 2;
      } else if (character <= 65535) {
        handle = "u";
        length = 4;
      } else if (character <= 4294967295) {
        handle = "U";
        length = 8;
      } else {
        throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
      }
      return "\\" + handle + common2.repeat("0", length - string.length) + string;
    }
    function State(options2) {
      this.schema = options2["schema"] || DEFAULT_FULL_SCHEMA;
      this.indent = Math.max(1, options2["indent"] || 2);
      this.noArrayIndent = options2["noArrayIndent"] || false;
      this.skipInvalid = options2["skipInvalid"] || false;
      this.flowLevel = common2.isNothing(options2["flowLevel"]) ? -1 : options2["flowLevel"];
      this.styleMap = compileStyleMap(this.schema, options2["styles"] || null);
      this.sortKeys = options2["sortKeys"] || false;
      this.lineWidth = options2["lineWidth"] || 80;
      this.noRefs = options2["noRefs"] || false;
      this.noCompatMode = options2["noCompatMode"] || false;
      this.condenseFlow = options2["condenseFlow"] || false;
      this.implicitTypes = this.schema.compiledImplicit;
      this.explicitTypes = this.schema.compiledExplicit;
      this.tag = null;
      this.result = "";
      this.duplicates = [];
      this.usedDuplicates = null;
    }
    function indentString(string, spaces) {
      var ind = common2.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
      while (position < length) {
        next = string.indexOf("\n", position);
        if (next === -1) {
          line = string.slice(position);
          position = length;
        } else {
          line = string.slice(position, next + 1);
          position = next + 1;
        }
        if (line.length && line !== "\n")
          result += ind;
        result += line;
      }
      return result;
    }
    function generateNextLine(state, level) {
      return "\n" + common2.repeat(" ", state.indent * level);
    }
    function testImplicitResolving(state, str) {
      var index2, length, type;
      for (index2 = 0, length = state.implicitTypes.length; index2 < length; index2 += 1) {
        type = state.implicitTypes[index2];
        if (type.resolve(str)) {
          return true;
        }
      }
      return false;
    }
    function isWhitespace(c) {
      return c === CHAR_SPACE || c === CHAR_TAB;
    }
    function isPrintable(c) {
      return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== 65279 || 65536 <= c && c <= 1114111;
    }
    function isNsChar(c) {
      return isPrintable(c) && !isWhitespace(c) && c !== 65279 && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
    }
    function isPlainSafe(c, prev) {
      return isPrintable(c) && c !== 65279 && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_COLON && (c !== CHAR_SHARP || prev && isNsChar(prev));
    }
    function isPlainSafeFirst(c) {
      return isPrintable(c) && c !== 65279 && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
    }
    function needIndentIndicator(string) {
      var leadingSpaceRe = /^\n* /;
      return leadingSpaceRe.test(string);
    }
    var STYLE_PLAIN = 1;
    var STYLE_SINGLE = 2;
    var STYLE_LITERAL = 3;
    var STYLE_FOLDED = 4;
    var STYLE_DOUBLE = 5;
    function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
      var i;
      var char, prev_char;
      var hasLineBreak = false;
      var hasFoldableLine = false;
      var shouldTrackWidth = lineWidth !== -1;
      var previousLineBreak = -1;
      var plain = isPlainSafeFirst(string.charCodeAt(0)) && !isWhitespace(string.charCodeAt(string.length - 1));
      if (singleLineOnly) {
        for (i = 0; i < string.length; i++) {
          char = string.charCodeAt(i);
          if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
          plain = plain && isPlainSafe(char, prev_char);
        }
      } else {
        for (i = 0; i < string.length; i++) {
          char = string.charCodeAt(i);
          if (char === CHAR_LINE_FEED) {
            hasLineBreak = true;
            if (shouldTrackWidth) {
              hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
              previousLineBreak = i;
            }
          } else if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
          plain = plain && isPlainSafe(char, prev_char);
        }
        hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
      }
      if (!hasLineBreak && !hasFoldableLine) {
        return plain && !testAmbiguousType(string) ? STYLE_PLAIN : STYLE_SINGLE;
      }
      if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
      }
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    function writeScalar(state, string, level, iskey) {
      state.dump = function() {
        if (string.length === 0) {
          return "''";
        }
        if (!state.noCompatMode && DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
          return "'" + string + "'";
        }
        var indent = state.indent * Math.max(1, level);
        var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
        var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
        function testAmbiguity(string2) {
          return testImplicitResolving(state, string2);
        }
        switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
          case STYLE_PLAIN:
            return string;
          case STYLE_SINGLE:
            return "'" + string.replace(/'/g, "''") + "'";
          case STYLE_LITERAL:
            return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
          case STYLE_FOLDED:
            return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
          case STYLE_DOUBLE:
            return '"' + escapeString(string, lineWidth) + '"';
          default:
            throw new YAMLException("impossible error: invalid scalar style");
        }
      }();
    }
    function blockHeader(string, indentPerLevel) {
      var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
      var clip = string[string.length - 1] === "\n";
      var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
      var chomp = keep ? "+" : clip ? "" : "-";
      return indentIndicator + chomp + "\n";
    }
    function dropEndingNewline(string) {
      return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
    }
    function foldString(string, width) {
      var lineRe = /(\n+)([^\n]*)/g;
      var result = function() {
        var nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
      }();
      var prevMoreIndented = string[0] === "\n" || string[0] === " ";
      var moreIndented;
      var match;
      while (match = lineRe.exec(string)) {
        var prefix = match[1], line = match[2];
        moreIndented = line[0] === " ";
        result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
        prevMoreIndented = moreIndented;
      }
      return result;
    }
    function foldLine(line, width) {
      if (line === "" || line[0] === " ")
        return line;
      var breakRe = / [^ ]/g;
      var match;
      var start = 0, end, curr = 0, next = 0;
      var result = "";
      while (match = breakRe.exec(line)) {
        next = match.index;
        if (next - start > width) {
          end = curr > start ? curr : next;
          result += "\n" + line.slice(start, end);
          start = end + 1;
        }
        curr = next;
      }
      result += "\n";
      if (line.length - start > width && curr > start) {
        result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
      } else {
        result += line.slice(start);
      }
      return result.slice(1);
    }
    function escapeString(string) {
      var result = "";
      var char, nextChar;
      var escapeSeq;
      for (var i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        if (char >= 55296 && char <= 56319) {
          nextChar = string.charCodeAt(i + 1);
          if (nextChar >= 56320 && nextChar <= 57343) {
            result += encodeHex((char - 55296) * 1024 + nextChar - 56320 + 65536);
            i++;
            continue;
          }
        }
        escapeSeq = ESCAPE_SEQUENCES[char];
        result += !escapeSeq && isPrintable(char) ? string[i] : escapeSeq || encodeHex(char);
      }
      return result;
    }
    function writeFlowSequence(state, level, object) {
      var _result = "", _tag = state.tag, index2, length;
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        if (writeNode(state, level, object[index2], false, false)) {
          if (index2 !== 0)
            _result += "," + (!state.condenseFlow ? " " : "");
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = "[" + _result + "]";
    }
    function writeBlockSequence(state, level, object, compact) {
      var _result = "", _tag = state.tag, index2, length;
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        if (writeNode(state, level + 1, object[index2], true, true)) {
          if (!compact || index2 !== 0) {
            _result += generateNextLine(state, level);
          }
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            _result += "-";
          } else {
            _result += "- ";
          }
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = _result || "[]";
    }
    function writeFlowMapping(state, level, object) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index2, length, objectKey, objectValue, pairBuffer;
      for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
        pairBuffer = "";
        if (index2 !== 0)
          pairBuffer += ", ";
        if (state.condenseFlow)
          pairBuffer += '"';
        objectKey = objectKeyList[index2];
        objectValue = object[objectKey];
        if (!writeNode(state, level, objectKey, false, false)) {
          continue;
        }
        if (state.dump.length > 1024)
          pairBuffer += "? ";
        pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
        if (!writeNode(state, level, objectValue, false, false)) {
          continue;
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = "{" + _result + "}";
    }
    function writeBlockMapping(state, level, object, compact) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index2, length, objectKey, objectValue, explicitPair, pairBuffer;
      if (state.sortKeys === true) {
        objectKeyList.sort();
      } else if (typeof state.sortKeys === "function") {
        objectKeyList.sort(state.sortKeys);
      } else if (state.sortKeys) {
        throw new YAMLException("sortKeys must be a boolean or a function");
      }
      for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
        pairBuffer = "";
        if (!compact || index2 !== 0) {
          pairBuffer += generateNextLine(state, level);
        }
        objectKey = objectKeyList[index2];
        objectValue = object[objectKey];
        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
          continue;
        }
        explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
        if (explicitPair) {
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += "?";
          } else {
            pairBuffer += "? ";
          }
        }
        pairBuffer += state.dump;
        if (explicitPair) {
          pairBuffer += generateNextLine(state, level);
        }
        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
          continue;
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += ":";
        } else {
          pairBuffer += ": ";
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = _result || "{}";
    }
    function detectType(state, object, explicit) {
      var _result, typeList, index2, length, type, style;
      typeList = explicit ? state.explicitTypes : state.implicitTypes;
      for (index2 = 0, length = typeList.length; index2 < length; index2 += 1) {
        type = typeList[index2];
        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
          state.tag = explicit ? type.tag : "?";
          if (type.represent) {
            style = state.styleMap[type.tag] || type.defaultStyle;
            if (_toString.call(type.represent) === "[object Function]") {
              _result = type.represent(object, style);
            } else if (_hasOwnProperty.call(type.represent, style)) {
              _result = type.represent[style](object, style);
            } else {
              throw new YAMLException("!<" + type.tag + '> tag resolver accepts not "' + style + '" style');
            }
            state.dump = _result;
          }
          return true;
        }
      }
      return false;
    }
    function writeNode(state, level, object, block, compact, iskey) {
      state.tag = null;
      state.dump = object;
      if (!detectType(state, object, false)) {
        detectType(state, object, true);
      }
      var type = _toString.call(state.dump);
      if (block) {
        block = state.flowLevel < 0 || state.flowLevel > level;
      }
      var objectOrArray = type === "[object Object]" || type === "[object Array]", duplicateIndex, duplicate;
      if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
      }
      if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
        compact = false;
      }
      if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = "*ref_" + duplicateIndex;
      } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
          state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
          if (block && Object.keys(state.dump).length !== 0) {
            writeBlockMapping(state, level, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowMapping(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object Array]") {
          var arrayLevel = state.noArrayIndent && level > 0 ? level - 1 : level;
          if (block && state.dump.length !== 0) {
            writeBlockSequence(state, arrayLevel, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowSequence(state, arrayLevel, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object String]") {
          if (state.tag !== "?") {
            writeScalar(state, state.dump, level, iskey);
          }
        } else {
          if (state.skipInvalid)
            return false;
          throw new YAMLException("unacceptable kind of an object to dump " + type);
        }
        if (state.tag !== null && state.tag !== "?") {
          state.dump = "!<" + state.tag + "> " + state.dump;
        }
      }
      return true;
    }
    function getDuplicateReferences(object, state) {
      var objects = [], duplicatesIndexes = [], index2, length;
      inspectNode(object, objects, duplicatesIndexes);
      for (index2 = 0, length = duplicatesIndexes.length; index2 < length; index2 += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index2]]);
      }
      state.usedDuplicates = new Array(length);
    }
    function inspectNode(object, objects, duplicatesIndexes) {
      var objectKeyList, index2, length;
      if (object !== null && typeof object === "object") {
        index2 = objects.indexOf(object);
        if (index2 !== -1) {
          if (duplicatesIndexes.indexOf(index2) === -1) {
            duplicatesIndexes.push(index2);
          }
        } else {
          objects.push(object);
          if (Array.isArray(object)) {
            for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
              inspectNode(object[index2], objects, duplicatesIndexes);
            }
          } else {
            objectKeyList = Object.keys(object);
            for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
              inspectNode(object[objectKeyList[index2]], objects, duplicatesIndexes);
            }
          }
        }
      }
    }
    function dump(input, options2) {
      options2 = options2 || {};
      var state = new State(options2);
      if (!state.noRefs)
        getDuplicateReferences(input, state);
      if (writeNode(state, 0, input, true, true))
        return state.dump + "\n";
      return "";
    }
    function safeDump(input, options2) {
      return dump(input, common2.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    module2.exports.dump = dump;
    module2.exports.safeDump = safeDump;
  }
});

// node_modules/js-yaml/lib/js-yaml.js
var require_js_yaml = __commonJS({
  "node_modules/js-yaml/lib/js-yaml.js"(exports, module2) {
    init_shims();
    "use strict";
    var loader = require_loader();
    var dumper = require_dumper();
    function deprecated(name) {
      return function() {
        throw new Error("Function " + name + " is deprecated and cannot be used.");
      };
    }
    module2.exports.Type = require_type();
    module2.exports.Schema = require_schema();
    module2.exports.FAILSAFE_SCHEMA = require_failsafe();
    module2.exports.JSON_SCHEMA = require_json();
    module2.exports.CORE_SCHEMA = require_core();
    module2.exports.DEFAULT_SAFE_SCHEMA = require_default_safe();
    module2.exports.DEFAULT_FULL_SCHEMA = require_default_full();
    module2.exports.load = loader.load;
    module2.exports.loadAll = loader.loadAll;
    module2.exports.safeLoad = loader.safeLoad;
    module2.exports.safeLoadAll = loader.safeLoadAll;
    module2.exports.dump = dumper.dump;
    module2.exports.safeDump = dumper.safeDump;
    module2.exports.YAMLException = require_exception();
    module2.exports.MINIMAL_SCHEMA = require_failsafe();
    module2.exports.SAFE_SCHEMA = require_default_safe();
    module2.exports.DEFAULT_SCHEMA = require_default_full();
    module2.exports.scan = deprecated("scan");
    module2.exports.parse = deprecated("parse");
    module2.exports.compose = deprecated("compose");
    module2.exports.addConstructor = deprecated("addConstructor");
  }
});

// node_modules/js-yaml/index.js
var require_js_yaml2 = __commonJS({
  "node_modules/js-yaml/index.js"(exports, module2) {
    init_shims();
    "use strict";
    var yaml2 = require_js_yaml();
    module2.exports = yaml2;
  }
});

// node_modules/marked/src/defaults.js
var require_defaults = __commonJS({
  "node_modules/marked/src/defaults.js"(exports, module2) {
    init_shims();
    function getDefaults() {
      return {
        baseUrl: null,
        breaks: false,
        extensions: null,
        gfm: true,
        headerIds: true,
        headerPrefix: "",
        highlight: null,
        langPrefix: "language-",
        mangle: true,
        pedantic: false,
        renderer: null,
        sanitize: false,
        sanitizer: null,
        silent: false,
        smartLists: false,
        smartypants: false,
        tokenizer: null,
        walkTokens: null,
        xhtml: false
      };
    }
    function changeDefaults(newDefaults) {
      module2.exports.defaults = newDefaults;
    }
    module2.exports = {
      defaults: getDefaults(),
      getDefaults,
      changeDefaults
    };
  }
});

// node_modules/marked/src/helpers.js
var require_helpers = __commonJS({
  "node_modules/marked/src/helpers.js"(exports, module2) {
    init_shims();
    var escapeTest = /[&<>"']/;
    var escapeReplace = /[&<>"']/g;
    var escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
    var escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
    var escapeReplacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    var getEscapeReplacement = (ch) => escapeReplacements[ch];
    function escape3(html, encode) {
      if (encode) {
        if (escapeTest.test(html)) {
          return html.replace(escapeReplace, getEscapeReplacement);
        }
      } else {
        if (escapeTestNoEncode.test(html)) {
          return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
        }
      }
      return html;
    }
    var unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
    function unescape2(html) {
      return html.replace(unescapeTest, (_, n) => {
        n = n.toLowerCase();
        if (n === "colon")
          return ":";
        if (n.charAt(0) === "#") {
          return n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
        }
        return "";
      });
    }
    var caret = /(^|[^\[])\^/g;
    function edit(regex, opt) {
      regex = regex.source || regex;
      opt = opt || "";
      const obj = {
        replace: (name, val) => {
          val = val.source || val;
          val = val.replace(caret, "$1");
          regex = regex.replace(name, val);
          return obj;
        },
        getRegex: () => {
          return new RegExp(regex, opt);
        }
      };
      return obj;
    }
    var nonWordAndColonTest = /[^\w:]/g;
    var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
    function cleanUrl(sanitize, base, href) {
      if (sanitize) {
        let prot;
        try {
          prot = decodeURIComponent(unescape2(href)).replace(nonWordAndColonTest, "").toLowerCase();
        } catch (e) {
          return null;
        }
        if (prot.indexOf("javascript:") === 0 || prot.indexOf("vbscript:") === 0 || prot.indexOf("data:") === 0) {
          return null;
        }
      }
      if (base && !originIndependentUrl.test(href)) {
        href = resolveUrl(base, href);
      }
      try {
        href = encodeURI(href).replace(/%25/g, "%");
      } catch (e) {
        return null;
      }
      return href;
    }
    var baseUrls = {};
    var justDomain = /^[^:]+:\/*[^/]*$/;
    var protocol = /^([^:]+:)[\s\S]*$/;
    var domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;
    function resolveUrl(base, href) {
      if (!baseUrls[" " + base]) {
        if (justDomain.test(base)) {
          baseUrls[" " + base] = base + "/";
        } else {
          baseUrls[" " + base] = rtrim(base, "/", true);
        }
      }
      base = baseUrls[" " + base];
      const relativeBase = base.indexOf(":") === -1;
      if (href.substring(0, 2) === "//") {
        if (relativeBase) {
          return href;
        }
        return base.replace(protocol, "$1") + href;
      } else if (href.charAt(0) === "/") {
        if (relativeBase) {
          return href;
        }
        return base.replace(domain, "$1") + href;
      } else {
        return base + href;
      }
    }
    var noopTest = { exec: function noopTest2() {
    } };
    function merge(obj) {
      let i = 1, target, key;
      for (; i < arguments.length; i++) {
        target = arguments[i];
        for (key in target) {
          if (Object.prototype.hasOwnProperty.call(target, key)) {
            obj[key] = target[key];
          }
        }
      }
      return obj;
    }
    function splitCells(tableRow, count) {
      const row = tableRow.replace(/\|/g, (match, offset, str) => {
        let escaped3 = false, curr = offset;
        while (--curr >= 0 && str[curr] === "\\")
          escaped3 = !escaped3;
        if (escaped3) {
          return "|";
        } else {
          return " |";
        }
      }), cells = row.split(/ \|/);
      let i = 0;
      if (cells.length > count) {
        cells.splice(count);
      } else {
        while (cells.length < count)
          cells.push("");
      }
      for (; i < cells.length; i++) {
        cells[i] = cells[i].trim().replace(/\\\|/g, "|");
      }
      return cells;
    }
    function rtrim(str, c, invert) {
      const l = str.length;
      if (l === 0) {
        return "";
      }
      let suffLen = 0;
      while (suffLen < l) {
        const currChar = str.charAt(l - suffLen - 1);
        if (currChar === c && !invert) {
          suffLen++;
        } else if (currChar !== c && invert) {
          suffLen++;
        } else {
          break;
        }
      }
      return str.substr(0, l - suffLen);
    }
    function findClosingBracket(str, b) {
      if (str.indexOf(b[1]) === -1) {
        return -1;
      }
      const l = str.length;
      let level = 0, i = 0;
      for (; i < l; i++) {
        if (str[i] === "\\") {
          i++;
        } else if (str[i] === b[0]) {
          level++;
        } else if (str[i] === b[1]) {
          level--;
          if (level < 0) {
            return i;
          }
        }
      }
      return -1;
    }
    function checkSanitizeDeprecation(opt) {
      if (opt && opt.sanitize && !opt.silent) {
        console.warn("marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options");
      }
    }
    function repeatString(pattern, count) {
      if (count < 1) {
        return "";
      }
      let result = "";
      while (count > 1) {
        if (count & 1) {
          result += pattern;
        }
        count >>= 1;
        pattern += pattern;
      }
      return result + pattern;
    }
    module2.exports = {
      escape: escape3,
      unescape: unescape2,
      edit,
      cleanUrl,
      resolveUrl,
      noopTest,
      merge,
      splitCells,
      rtrim,
      findClosingBracket,
      checkSanitizeDeprecation,
      repeatString
    };
  }
});

// node_modules/marked/src/Tokenizer.js
var require_Tokenizer = __commonJS({
  "node_modules/marked/src/Tokenizer.js"(exports, module2) {
    init_shims();
    var { defaults } = require_defaults();
    var {
      rtrim,
      splitCells,
      escape: escape3,
      findClosingBracket
    } = require_helpers();
    function outputLink(cap, link, raw) {
      const href = link.href;
      const title = link.title ? escape3(link.title) : null;
      const text = cap[1].replace(/\\([\[\]])/g, "$1");
      if (cap[0].charAt(0) !== "!") {
        return {
          type: "link",
          raw,
          href,
          title,
          text
        };
      } else {
        return {
          type: "image",
          raw,
          href,
          title,
          text: escape3(text)
        };
      }
    }
    function indentCodeCompensation(raw, text) {
      const matchIndentToCode = raw.match(/^(\s+)(?:```)/);
      if (matchIndentToCode === null) {
        return text;
      }
      const indentToCode = matchIndentToCode[1];
      return text.split("\n").map((node) => {
        const matchIndentInNode = node.match(/^\s+/);
        if (matchIndentInNode === null) {
          return node;
        }
        const [indentInNode] = matchIndentInNode;
        if (indentInNode.length >= indentToCode.length) {
          return node.slice(indentToCode.length);
        }
        return node;
      }).join("\n");
    }
    module2.exports = class Tokenizer {
      constructor(options2) {
        this.options = options2 || defaults;
      }
      space(src2) {
        const cap = this.rules.block.newline.exec(src2);
        if (cap) {
          if (cap[0].length > 1) {
            return {
              type: "space",
              raw: cap[0]
            };
          }
          return { raw: "\n" };
        }
      }
      code(src2) {
        const cap = this.rules.block.code.exec(src2);
        if (cap) {
          const text = cap[0].replace(/^ {1,4}/gm, "");
          return {
            type: "code",
            raw: cap[0],
            codeBlockStyle: "indented",
            text: !this.options.pedantic ? rtrim(text, "\n") : text
          };
        }
      }
      fences(src2) {
        const cap = this.rules.block.fences.exec(src2);
        if (cap) {
          const raw = cap[0];
          const text = indentCodeCompensation(raw, cap[3] || "");
          return {
            type: "code",
            raw,
            lang: cap[2] ? cap[2].trim() : cap[2],
            text
          };
        }
      }
      heading(src2) {
        const cap = this.rules.block.heading.exec(src2);
        if (cap) {
          let text = cap[2].trim();
          if (/#$/.test(text)) {
            const trimmed = rtrim(text, "#");
            if (this.options.pedantic) {
              text = trimmed.trim();
            } else if (!trimmed || / $/.test(trimmed)) {
              text = trimmed.trim();
            }
          }
          return {
            type: "heading",
            raw: cap[0],
            depth: cap[1].length,
            text
          };
        }
      }
      nptable(src2) {
        const cap = this.rules.block.nptable.exec(src2);
        if (cap) {
          const item = {
            type: "table",
            header: splitCells(cap[1].replace(/^ *| *\| *$/g, "")),
            align: cap[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
            cells: cap[3] ? cap[3].replace(/\n$/, "").split("\n") : [],
            raw: cap[0]
          };
          if (item.header.length === item.align.length) {
            let l = item.align.length;
            let i;
            for (i = 0; i < l; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = "right";
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = "center";
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = "left";
              } else {
                item.align[i] = null;
              }
            }
            l = item.cells.length;
            for (i = 0; i < l; i++) {
              item.cells[i] = splitCells(item.cells[i], item.header.length);
            }
            return item;
          }
        }
      }
      hr(src2) {
        const cap = this.rules.block.hr.exec(src2);
        if (cap) {
          return {
            type: "hr",
            raw: cap[0]
          };
        }
      }
      blockquote(src2) {
        const cap = this.rules.block.blockquote.exec(src2);
        if (cap) {
          const text = cap[0].replace(/^ *> ?/gm, "");
          return {
            type: "blockquote",
            raw: cap[0],
            text
          };
        }
      }
      list(src2) {
        const cap = this.rules.block.list.exec(src2);
        if (cap) {
          let raw = cap[0];
          const bull = cap[2];
          const isordered = bull.length > 1;
          const list = {
            type: "list",
            raw,
            ordered: isordered,
            start: isordered ? +bull.slice(0, -1) : "",
            loose: false,
            items: []
          };
          const itemMatch = cap[0].match(this.rules.block.item);
          let next = false, item, space, bcurr, bnext, addBack, loose, istask, ischecked, endMatch;
          let l = itemMatch.length;
          bcurr = this.rules.block.listItemStart.exec(itemMatch[0]);
          for (let i = 0; i < l; i++) {
            item = itemMatch[i];
            raw = item;
            if (!this.options.pedantic) {
              endMatch = item.match(new RegExp("\\n\\s*\\n {0," + (bcurr[0].length - 1) + "}\\S"));
              if (endMatch) {
                addBack = item.length - endMatch.index + itemMatch.slice(i + 1).join("\n").length;
                list.raw = list.raw.substring(0, list.raw.length - addBack);
                item = item.substring(0, endMatch.index);
                raw = item;
                l = i + 1;
              }
            }
            if (i !== l - 1) {
              bnext = this.rules.block.listItemStart.exec(itemMatch[i + 1]);
              if (!this.options.pedantic ? bnext[1].length >= bcurr[0].length || bnext[1].length > 3 : bnext[1].length > bcurr[1].length) {
                itemMatch.splice(i, 2, itemMatch[i] + (!this.options.pedantic && bnext[1].length < bcurr[0].length && !itemMatch[i].match(/\n$/) ? "" : "\n") + itemMatch[i + 1]);
                i--;
                l--;
                continue;
              } else if (!this.options.pedantic || this.options.smartLists ? bnext[2][bnext[2].length - 1] !== bull[bull.length - 1] : isordered === (bnext[2].length === 1)) {
                addBack = itemMatch.slice(i + 1).join("\n").length;
                list.raw = list.raw.substring(0, list.raw.length - addBack);
                i = l - 1;
              }
              bcurr = bnext;
            }
            space = item.length;
            item = item.replace(/^ *([*+-]|\d+[.)]) ?/, "");
            if (~item.indexOf("\n ")) {
              space -= item.length;
              item = !this.options.pedantic ? item.replace(new RegExp("^ {1," + space + "}", "gm"), "") : item.replace(/^ {1,4}/gm, "");
            }
            item = rtrim(item, "\n");
            if (i !== l - 1) {
              raw = raw + "\n";
            }
            loose = next || /\n\n(?!\s*$)/.test(raw);
            if (i !== l - 1) {
              next = raw.slice(-2) === "\n\n";
              if (!loose)
                loose = next;
            }
            if (loose) {
              list.loose = true;
            }
            if (this.options.gfm) {
              istask = /^\[[ xX]\] /.test(item);
              ischecked = void 0;
              if (istask) {
                ischecked = item[1] !== " ";
                item = item.replace(/^\[[ xX]\] +/, "");
              }
            }
            list.items.push({
              type: "list_item",
              raw,
              task: istask,
              checked: ischecked,
              loose,
              text: item
            });
          }
          return list;
        }
      }
      html(src2) {
        const cap = this.rules.block.html.exec(src2);
        if (cap) {
          return {
            type: this.options.sanitize ? "paragraph" : "html",
            raw: cap[0],
            pre: !this.options.sanitizer && (cap[1] === "pre" || cap[1] === "script" || cap[1] === "style"),
            text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape3(cap[0]) : cap[0]
          };
        }
      }
      def(src2) {
        const cap = this.rules.block.def.exec(src2);
        if (cap) {
          if (cap[3])
            cap[3] = cap[3].substring(1, cap[3].length - 1);
          const tag = cap[1].toLowerCase().replace(/\s+/g, " ");
          return {
            type: "def",
            tag,
            raw: cap[0],
            href: cap[2],
            title: cap[3]
          };
        }
      }
      table(src2) {
        const cap = this.rules.block.table.exec(src2);
        if (cap) {
          const item = {
            type: "table",
            header: splitCells(cap[1].replace(/^ *| *\| *$/g, "")),
            align: cap[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
            cells: cap[3] ? cap[3].replace(/\n$/, "").split("\n") : []
          };
          if (item.header.length === item.align.length) {
            item.raw = cap[0];
            let l = item.align.length;
            let i;
            for (i = 0; i < l; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = "right";
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = "center";
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = "left";
              } else {
                item.align[i] = null;
              }
            }
            l = item.cells.length;
            for (i = 0; i < l; i++) {
              item.cells[i] = splitCells(item.cells[i].replace(/^ *\| *| *\| *$/g, ""), item.header.length);
            }
            return item;
          }
        }
      }
      lheading(src2) {
        const cap = this.rules.block.lheading.exec(src2);
        if (cap) {
          return {
            type: "heading",
            raw: cap[0],
            depth: cap[2].charAt(0) === "=" ? 1 : 2,
            text: cap[1]
          };
        }
      }
      paragraph(src2) {
        const cap = this.rules.block.paragraph.exec(src2);
        if (cap) {
          return {
            type: "paragraph",
            raw: cap[0],
            text: cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1]
          };
        }
      }
      text(src2) {
        const cap = this.rules.block.text.exec(src2);
        if (cap) {
          return {
            type: "text",
            raw: cap[0],
            text: cap[0]
          };
        }
      }
      escape(src2) {
        const cap = this.rules.inline.escape.exec(src2);
        if (cap) {
          return {
            type: "escape",
            raw: cap[0],
            text: escape3(cap[1])
          };
        }
      }
      tag(src2, inLink, inRawBlock) {
        const cap = this.rules.inline.tag.exec(src2);
        if (cap) {
          if (!inLink && /^<a /i.test(cap[0])) {
            inLink = true;
          } else if (inLink && /^<\/a>/i.test(cap[0])) {
            inLink = false;
          }
          if (!inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
            inRawBlock = true;
          } else if (inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
            inRawBlock = false;
          }
          return {
            type: this.options.sanitize ? "text" : "html",
            raw: cap[0],
            inLink,
            inRawBlock,
            text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape3(cap[0]) : cap[0]
          };
        }
      }
      link(src2) {
        const cap = this.rules.inline.link.exec(src2);
        if (cap) {
          const trimmedUrl = cap[2].trim();
          if (!this.options.pedantic && /^</.test(trimmedUrl)) {
            if (!/>$/.test(trimmedUrl)) {
              return;
            }
            const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
            if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
              return;
            }
          } else {
            const lastParenIndex = findClosingBracket(cap[2], "()");
            if (lastParenIndex > -1) {
              const start = cap[0].indexOf("!") === 0 ? 5 : 4;
              const linkLen = start + cap[1].length + lastParenIndex;
              cap[2] = cap[2].substring(0, lastParenIndex);
              cap[0] = cap[0].substring(0, linkLen).trim();
              cap[3] = "";
            }
          }
          let href = cap[2];
          let title = "";
          if (this.options.pedantic) {
            const link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
            if (link) {
              href = link[1];
              title = link[3];
            }
          } else {
            title = cap[3] ? cap[3].slice(1, -1) : "";
          }
          href = href.trim();
          if (/^</.test(href)) {
            if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
              href = href.slice(1);
            } else {
              href = href.slice(1, -1);
            }
          }
          return outputLink(cap, {
            href: href ? href.replace(this.rules.inline._escapes, "$1") : href,
            title: title ? title.replace(this.rules.inline._escapes, "$1") : title
          }, cap[0]);
        }
      }
      reflink(src2, links) {
        let cap;
        if ((cap = this.rules.inline.reflink.exec(src2)) || (cap = this.rules.inline.nolink.exec(src2))) {
          let link = (cap[2] || cap[1]).replace(/\s+/g, " ");
          link = links[link.toLowerCase()];
          if (!link || !link.href) {
            const text = cap[0].charAt(0);
            return {
              type: "text",
              raw: text,
              text
            };
          }
          return outputLink(cap, link, cap[0]);
        }
      }
      emStrong(src2, maskedSrc, prevChar = "") {
        let match = this.rules.inline.emStrong.lDelim.exec(src2);
        if (!match)
          return;
        if (match[3] && prevChar.match(/[\p{L}\p{N}]/u))
          return;
        const nextChar = match[1] || match[2] || "";
        if (!nextChar || nextChar && (prevChar === "" || this.rules.inline.punctuation.exec(prevChar))) {
          const lLength = match[0].length - 1;
          let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
          const endReg = match[0][0] === "*" ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
          endReg.lastIndex = 0;
          maskedSrc = maskedSrc.slice(-1 * src2.length + lLength);
          while ((match = endReg.exec(maskedSrc)) != null) {
            rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
            if (!rDelim)
              continue;
            rLength = rDelim.length;
            if (match[3] || match[4]) {
              delimTotal += rLength;
              continue;
            } else if (match[5] || match[6]) {
              if (lLength % 3 && !((lLength + rLength) % 3)) {
                midDelimTotal += rLength;
                continue;
              }
            }
            delimTotal -= rLength;
            if (delimTotal > 0)
              continue;
            rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
            if (Math.min(lLength, rLength) % 2) {
              return {
                type: "em",
                raw: src2.slice(0, lLength + match.index + rLength + 1),
                text: src2.slice(1, lLength + match.index + rLength)
              };
            }
            return {
              type: "strong",
              raw: src2.slice(0, lLength + match.index + rLength + 1),
              text: src2.slice(2, lLength + match.index + rLength - 1)
            };
          }
        }
      }
      codespan(src2) {
        const cap = this.rules.inline.code.exec(src2);
        if (cap) {
          let text = cap[2].replace(/\n/g, " ");
          const hasNonSpaceChars = /[^ ]/.test(text);
          const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
          if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
            text = text.substring(1, text.length - 1);
          }
          text = escape3(text, true);
          return {
            type: "codespan",
            raw: cap[0],
            text
          };
        }
      }
      br(src2) {
        const cap = this.rules.inline.br.exec(src2);
        if (cap) {
          return {
            type: "br",
            raw: cap[0]
          };
        }
      }
      del(src2) {
        const cap = this.rules.inline.del.exec(src2);
        if (cap) {
          return {
            type: "del",
            raw: cap[0],
            text: cap[2]
          };
        }
      }
      autolink(src2, mangle) {
        const cap = this.rules.inline.autolink.exec(src2);
        if (cap) {
          let text, href;
          if (cap[2] === "@") {
            text = escape3(this.options.mangle ? mangle(cap[1]) : cap[1]);
            href = "mailto:" + text;
          } else {
            text = escape3(cap[1]);
            href = text;
          }
          return {
            type: "link",
            raw: cap[0],
            text,
            href,
            tokens: [
              {
                type: "text",
                raw: text,
                text
              }
            ]
          };
        }
      }
      url(src2, mangle) {
        let cap;
        if (cap = this.rules.inline.url.exec(src2)) {
          let text, href;
          if (cap[2] === "@") {
            text = escape3(this.options.mangle ? mangle(cap[0]) : cap[0]);
            href = "mailto:" + text;
          } else {
            let prevCapZero;
            do {
              prevCapZero = cap[0];
              cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
            } while (prevCapZero !== cap[0]);
            text = escape3(cap[0]);
            if (cap[1] === "www.") {
              href = "http://" + text;
            } else {
              href = text;
            }
          }
          return {
            type: "link",
            raw: cap[0],
            text,
            href,
            tokens: [
              {
                type: "text",
                raw: text,
                text
              }
            ]
          };
        }
      }
      inlineText(src2, inRawBlock, smartypants) {
        const cap = this.rules.inline.text.exec(src2);
        if (cap) {
          let text;
          if (inRawBlock) {
            text = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape3(cap[0]) : cap[0];
          } else {
            text = escape3(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
          }
          return {
            type: "text",
            raw: cap[0],
            text
          };
        }
      }
    };
  }
});

// node_modules/marked/src/rules.js
var require_rules = __commonJS({
  "node_modules/marked/src/rules.js"(exports, module2) {
    init_shims();
    var {
      noopTest,
      edit,
      merge
    } = require_helpers();
    var block = {
      newline: /^(?: *(?:\n|$))+/,
      code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
      fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
      hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
      heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
      blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
      list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?! {0,3}bull )\n*|\s*$)/,
      html: "^ {0,3}(?:<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))",
      def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
      nptable: noopTest,
      table: noopTest,
      lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
      _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html| +\n)[^\n]+)*)/,
      text: /^[^\n]+/
    };
    block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
    block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
    block.def = edit(block.def).replace("label", block._label).replace("title", block._title).getRegex();
    block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
    block.item = /^( *)(bull) ?[^\n]*(?:\n(?! *bull ?)[^\n]*)*/;
    block.item = edit(block.item, "gm").replace(/bull/g, block.bullet).getRegex();
    block.listItemStart = edit(/^( *)(bull) */).replace("bull", block.bullet).getRegex();
    block.list = edit(block.list).replace(/bull/g, block.bullet).replace("hr", "\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))").replace("def", "\\n+(?=" + block.def.source + ")").getRegex();
    block._tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
    block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
    block.html = edit(block.html, "i").replace("comment", block._comment).replace("tag", block._tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
    block.paragraph = edit(block._paragraph).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)").replace("tag", block._tag).getRegex();
    block.blockquote = edit(block.blockquote).replace("paragraph", block.paragraph).getRegex();
    block.normal = merge({}, block);
    block.gfm = merge({}, block.normal, {
      nptable: "^ *([^|\\n ].*\\|.*)\\n {0,3}([-:]+ *\\|[-| :]*)(?:\\n((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)",
      table: "^ *\\|(.+)\\n {0,3}\\|?( *[-:]+[-| :]*)(?:\\n *((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
    });
    block.gfm.nptable = edit(block.gfm.nptable).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)").replace("tag", block._tag).getRegex();
    block.gfm.table = edit(block.gfm.table).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)").replace("tag", block._tag).getRegex();
    block.pedantic = merge({}, block.normal, {
      html: edit(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", block._comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
      def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
      heading: /^(#{1,6})(.*)(?:\n+|$)/,
      fences: noopTest,
      paragraph: edit(block.normal._paragraph).replace("hr", block.hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", block.lheading).replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").getRegex()
    });
    var inline = {
      escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
      autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
      url: noopTest,
      tag: "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
      link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
      reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
      nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
      reflinkSearch: "reflink|nolink(?!\\()",
      emStrong: {
        lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
        rDelimAst: /\_\_[^_*]*?\*[^_*]*?\_\_|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
        rDelimUnd: /\*\*[^_*]*?\_[^_*]*?\*\*|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/
      },
      code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
      br: /^( {2,}|\\)\n(?!\s*$)/,
      del: noopTest,
      text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
      punctuation: /^([\spunctuation])/
    };
    inline._punctuation = "!\"#$%&'()+\\-.,/:;<=>?@\\[\\]`^{|}~";
    inline.punctuation = edit(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex();
    inline.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
    inline.escapedEmSt = /\\\*|\\_/g;
    inline._comment = edit(block._comment).replace("(?:-->|$)", "-->").getRegex();
    inline.emStrong.lDelim = edit(inline.emStrong.lDelim).replace(/punct/g, inline._punctuation).getRegex();
    inline.emStrong.rDelimAst = edit(inline.emStrong.rDelimAst, "g").replace(/punct/g, inline._punctuation).getRegex();
    inline.emStrong.rDelimUnd = edit(inline.emStrong.rDelimUnd, "g").replace(/punct/g, inline._punctuation).getRegex();
    inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
    inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
    inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
    inline.autolink = edit(inline.autolink).replace("scheme", inline._scheme).replace("email", inline._email).getRegex();
    inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
    inline.tag = edit(inline.tag).replace("comment", inline._comment).replace("attribute", inline._attribute).getRegex();
    inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
    inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
    inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
    inline.link = edit(inline.link).replace("label", inline._label).replace("href", inline._href).replace("title", inline._title).getRegex();
    inline.reflink = edit(inline.reflink).replace("label", inline._label).getRegex();
    inline.reflinkSearch = edit(inline.reflinkSearch, "g").replace("reflink", inline.reflink).replace("nolink", inline.nolink).getRegex();
    inline.normal = merge({}, inline);
    inline.pedantic = merge({}, inline.normal, {
      strong: {
        start: /^__|\*\*/,
        middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
        endAst: /\*\*(?!\*)/g,
        endUnd: /__(?!_)/g
      },
      em: {
        start: /^_|\*/,
        middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
        endAst: /\*(?!\*)/g,
        endUnd: /_(?!_)/g
      },
      link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", inline._label).getRegex(),
      reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", inline._label).getRegex()
    });
    inline.gfm = merge({}, inline.normal, {
      escape: edit(inline.escape).replace("])", "~|])").getRegex(),
      _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
      url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
      _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
      del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
      text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
    });
    inline.gfm.url = edit(inline.gfm.url, "i").replace("email", inline.gfm._extended_email).getRegex();
    inline.breaks = merge({}, inline.gfm, {
      br: edit(inline.br).replace("{2,}", "*").getRegex(),
      text: edit(inline.gfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
    });
    module2.exports = {
      block,
      inline
    };
  }
});

// node_modules/marked/src/Lexer.js
var require_Lexer = __commonJS({
  "node_modules/marked/src/Lexer.js"(exports, module2) {
    init_shims();
    var Tokenizer = require_Tokenizer();
    var { defaults } = require_defaults();
    var { block, inline } = require_rules();
    var { repeatString } = require_helpers();
    function smartypants(text) {
      return text.replace(/---/g, "\u2014").replace(/--/g, "\u2013").replace(/(^|[-\u2014/(\[{"\s])'/g, "$1\u2018").replace(/'/g, "\u2019").replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1\u201C").replace(/"/g, "\u201D").replace(/\.{3}/g, "\u2026");
    }
    function mangle(text) {
      let out = "", i, ch;
      const l = text.length;
      for (i = 0; i < l; i++) {
        ch = text.charCodeAt(i);
        if (Math.random() > 0.5) {
          ch = "x" + ch.toString(16);
        }
        out += "&#" + ch + ";";
      }
      return out;
    }
    module2.exports = class Lexer {
      constructor(options2) {
        this.tokens = [];
        this.tokens.links = Object.create(null);
        this.options = options2 || defaults;
        this.options.tokenizer = this.options.tokenizer || new Tokenizer();
        this.tokenizer = this.options.tokenizer;
        this.tokenizer.options = this.options;
        const rules = {
          block: block.normal,
          inline: inline.normal
        };
        if (this.options.pedantic) {
          rules.block = block.pedantic;
          rules.inline = inline.pedantic;
        } else if (this.options.gfm) {
          rules.block = block.gfm;
          if (this.options.breaks) {
            rules.inline = inline.breaks;
          } else {
            rules.inline = inline.gfm;
          }
        }
        this.tokenizer.rules = rules;
      }
      static get rules() {
        return {
          block,
          inline
        };
      }
      static lex(src2, options2) {
        const lexer = new Lexer(options2);
        return lexer.lex(src2);
      }
      static lexInline(src2, options2) {
        const lexer = new Lexer(options2);
        return lexer.inlineTokens(src2);
      }
      lex(src2) {
        src2 = src2.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ");
        this.blockTokens(src2, this.tokens, true);
        this.inline(this.tokens);
        return this.tokens;
      }
      blockTokens(src2, tokens = [], top = true) {
        if (this.options.pedantic) {
          src2 = src2.replace(/^ +$/gm, "");
        }
        let token, i, l, lastToken, cutSrc, lastParagraphClipped;
        while (src2) {
          if (this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((extTokenizer) => {
            if (token = extTokenizer.call(this, src2, tokens)) {
              src2 = src2.substring(token.raw.length);
              tokens.push(token);
              return true;
            }
            return false;
          })) {
            continue;
          }
          if (token = this.tokenizer.space(src2)) {
            src2 = src2.substring(token.raw.length);
            if (token.type) {
              tokens.push(token);
            }
            continue;
          }
          if (token = this.tokenizer.code(src2)) {
            src2 = src2.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (lastToken && lastToken.type === "paragraph") {
              lastToken.raw += "\n" + token.raw;
              lastToken.text += "\n" + token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (token = this.tokenizer.fences(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.heading(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.nptable(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.hr(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.blockquote(src2)) {
            src2 = src2.substring(token.raw.length);
            token.tokens = this.blockTokens(token.text, [], top);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.list(src2)) {
            src2 = src2.substring(token.raw.length);
            l = token.items.length;
            for (i = 0; i < l; i++) {
              token.items[i].tokens = this.blockTokens(token.items[i].text, [], false);
            }
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.html(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (top && (token = this.tokenizer.def(src2))) {
            src2 = src2.substring(token.raw.length);
            if (!this.tokens.links[token.tag]) {
              this.tokens.links[token.tag] = {
                href: token.href,
                title: token.title
              };
            }
            continue;
          }
          if (token = this.tokenizer.table(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.lheading(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          cutSrc = src2;
          if (this.options.extensions && this.options.extensions.startBlock) {
            let startIndex = Infinity;
            const tempSrc = src2.slice(1);
            let tempStart;
            this.options.extensions.startBlock.forEach(function(getStartIndex) {
              tempStart = getStartIndex.call(this, tempSrc);
              if (typeof tempStart === "number" && tempStart >= 0) {
                startIndex = Math.min(startIndex, tempStart);
              }
            });
            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src2.substring(0, startIndex + 1);
            }
          }
          if (top && (token = this.tokenizer.paragraph(cutSrc))) {
            lastToken = tokens[tokens.length - 1];
            if (lastParagraphClipped && lastToken.type === "paragraph") {
              lastToken.raw += "\n" + token.raw;
              lastToken.text += "\n" + token.text;
            } else {
              tokens.push(token);
            }
            lastParagraphClipped = cutSrc.length !== src2.length;
            src2 = src2.substring(token.raw.length);
            continue;
          }
          if (token = this.tokenizer.text(src2)) {
            src2 = src2.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (lastToken && lastToken.type === "text") {
              lastToken.raw += "\n" + token.raw;
              lastToken.text += "\n" + token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (src2) {
            const errMsg = "Infinite loop on byte: " + src2.charCodeAt(0);
            if (this.options.silent) {
              console.error(errMsg);
              break;
            } else {
              throw new Error(errMsg);
            }
          }
        }
        return tokens;
      }
      inline(tokens) {
        let i, j, k, l2, row, token;
        const l = tokens.length;
        for (i = 0; i < l; i++) {
          token = tokens[i];
          switch (token.type) {
            case "paragraph":
            case "text":
            case "heading": {
              token.tokens = [];
              this.inlineTokens(token.text, token.tokens);
              break;
            }
            case "table": {
              token.tokens = {
                header: [],
                cells: []
              };
              l2 = token.header.length;
              for (j = 0; j < l2; j++) {
                token.tokens.header[j] = [];
                this.inlineTokens(token.header[j], token.tokens.header[j]);
              }
              l2 = token.cells.length;
              for (j = 0; j < l2; j++) {
                row = token.cells[j];
                token.tokens.cells[j] = [];
                for (k = 0; k < row.length; k++) {
                  token.tokens.cells[j][k] = [];
                  this.inlineTokens(row[k], token.tokens.cells[j][k]);
                }
              }
              break;
            }
            case "blockquote": {
              this.inline(token.tokens);
              break;
            }
            case "list": {
              l2 = token.items.length;
              for (j = 0; j < l2; j++) {
                this.inline(token.items[j].tokens);
              }
              break;
            }
            default: {
            }
          }
        }
        return tokens;
      }
      inlineTokens(src2, tokens = [], inLink = false, inRawBlock = false) {
        let token, lastToken, cutSrc;
        let maskedSrc = src2;
        let match;
        let keepPrevChar, prevChar;
        if (this.tokens.links) {
          const links = Object.keys(this.tokens.links);
          if (links.length > 0) {
            while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
              if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
                maskedSrc = maskedSrc.slice(0, match.index) + "[" + repeatString("a", match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
              }
            }
          }
        }
        while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
          maskedSrc = maskedSrc.slice(0, match.index) + "[" + repeatString("a", match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
        }
        while ((match = this.tokenizer.rules.inline.escapedEmSt.exec(maskedSrc)) != null) {
          maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
        }
        while (src2) {
          if (!keepPrevChar) {
            prevChar = "";
          }
          keepPrevChar = false;
          if (this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((extTokenizer) => {
            if (token = extTokenizer.call(this, src2, tokens)) {
              src2 = src2.substring(token.raw.length);
              tokens.push(token);
              return true;
            }
            return false;
          })) {
            continue;
          }
          if (token = this.tokenizer.escape(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.tag(src2, inLink, inRawBlock)) {
            src2 = src2.substring(token.raw.length);
            inLink = token.inLink;
            inRawBlock = token.inRawBlock;
            lastToken = tokens[tokens.length - 1];
            if (lastToken && token.type === "text" && lastToken.type === "text") {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (token = this.tokenizer.link(src2)) {
            src2 = src2.substring(token.raw.length);
            if (token.type === "link") {
              token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
            }
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.reflink(src2, this.tokens.links)) {
            src2 = src2.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (token.type === "link") {
              token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
              tokens.push(token);
            } else if (lastToken && token.type === "text" && lastToken.type === "text") {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (token = this.tokenizer.emStrong(src2, maskedSrc, prevChar)) {
            src2 = src2.substring(token.raw.length);
            token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.codespan(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.br(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.del(src2)) {
            src2 = src2.substring(token.raw.length);
            token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.autolink(src2, mangle)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (!inLink && (token = this.tokenizer.url(src2, mangle))) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          cutSrc = src2;
          if (this.options.extensions && this.options.extensions.startInline) {
            let startIndex = Infinity;
            const tempSrc = src2.slice(1);
            let tempStart;
            this.options.extensions.startInline.forEach(function(getStartIndex) {
              tempStart = getStartIndex.call(this, tempSrc);
              if (typeof tempStart === "number" && tempStart >= 0) {
                startIndex = Math.min(startIndex, tempStart);
              }
            });
            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src2.substring(0, startIndex + 1);
            }
          }
          if (token = this.tokenizer.inlineText(cutSrc, inRawBlock, smartypants)) {
            src2 = src2.substring(token.raw.length);
            if (token.raw.slice(-1) !== "_") {
              prevChar = token.raw.slice(-1);
            }
            keepPrevChar = true;
            lastToken = tokens[tokens.length - 1];
            if (lastToken && lastToken.type === "text") {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (src2) {
            const errMsg = "Infinite loop on byte: " + src2.charCodeAt(0);
            if (this.options.silent) {
              console.error(errMsg);
              break;
            } else {
              throw new Error(errMsg);
            }
          }
        }
        return tokens;
      }
    };
  }
});

// node_modules/marked/src/Renderer.js
var require_Renderer = __commonJS({
  "node_modules/marked/src/Renderer.js"(exports, module2) {
    init_shims();
    var { defaults } = require_defaults();
    var {
      cleanUrl,
      escape: escape3
    } = require_helpers();
    module2.exports = class Renderer {
      constructor(options2) {
        this.options = options2 || defaults;
      }
      code(code, infostring, escaped3) {
        const lang = (infostring || "").match(/\S*/)[0];
        if (this.options.highlight) {
          const out = this.options.highlight(code, lang);
          if (out != null && out !== code) {
            escaped3 = true;
            code = out;
          }
        }
        code = code.replace(/\n$/, "") + "\n";
        if (!lang) {
          return "<pre><code>" + (escaped3 ? code : escape3(code, true)) + "</code></pre>\n";
        }
        return '<pre><code class="' + this.options.langPrefix + escape3(lang, true) + '">' + (escaped3 ? code : escape3(code, true)) + "</code></pre>\n";
      }
      blockquote(quote) {
        return "<blockquote>\n" + quote + "</blockquote>\n";
      }
      html(html) {
        return html;
      }
      heading(text, level, raw, slugger) {
        if (this.options.headerIds) {
          return "<h" + level + ' id="' + this.options.headerPrefix + slugger.slug(raw) + '">' + text + "</h" + level + ">\n";
        }
        return "<h" + level + ">" + text + "</h" + level + ">\n";
      }
      hr() {
        return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
      }
      list(body, ordered, start) {
        const type = ordered ? "ol" : "ul", startatt = ordered && start !== 1 ? ' start="' + start + '"' : "";
        return "<" + type + startatt + ">\n" + body + "</" + type + ">\n";
      }
      listitem(text) {
        return "<li>" + text + "</li>\n";
      }
      checkbox(checked) {
        return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox"' + (this.options.xhtml ? " /" : "") + "> ";
      }
      paragraph(text) {
        return "<p>" + text + "</p>\n";
      }
      table(header, body) {
        if (body)
          body = "<tbody>" + body + "</tbody>";
        return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
      }
      tablerow(content) {
        return "<tr>\n" + content + "</tr>\n";
      }
      tablecell(content, flags) {
        const type = flags.header ? "th" : "td";
        const tag = flags.align ? "<" + type + ' align="' + flags.align + '">' : "<" + type + ">";
        return tag + content + "</" + type + ">\n";
      }
      strong(text) {
        return "<strong>" + text + "</strong>";
      }
      em(text) {
        return "<em>" + text + "</em>";
      }
      codespan(text) {
        return "<code>" + text + "</code>";
      }
      br() {
        return this.options.xhtml ? "<br/>" : "<br>";
      }
      del(text) {
        return "<del>" + text + "</del>";
      }
      link(href, title, text) {
        href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
        if (href === null) {
          return text;
        }
        let out = '<a href="' + escape3(href) + '"';
        if (title) {
          out += ' title="' + title + '"';
        }
        out += ">" + text + "</a>";
        return out;
      }
      image(href, title, text) {
        href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
        if (href === null) {
          return text;
        }
        let out = '<img src="' + href + '" alt="' + text + '"';
        if (title) {
          out += ' title="' + title + '"';
        }
        out += this.options.xhtml ? "/>" : ">";
        return out;
      }
      text(text) {
        return text;
      }
    };
  }
});

// node_modules/marked/src/TextRenderer.js
var require_TextRenderer = __commonJS({
  "node_modules/marked/src/TextRenderer.js"(exports, module2) {
    init_shims();
    module2.exports = class TextRenderer {
      strong(text) {
        return text;
      }
      em(text) {
        return text;
      }
      codespan(text) {
        return text;
      }
      del(text) {
        return text;
      }
      html(text) {
        return text;
      }
      text(text) {
        return text;
      }
      link(href, title, text) {
        return "" + text;
      }
      image(href, title, text) {
        return "" + text;
      }
      br() {
        return "";
      }
    };
  }
});

// node_modules/marked/src/Slugger.js
var require_Slugger = __commonJS({
  "node_modules/marked/src/Slugger.js"(exports, module2) {
    init_shims();
    module2.exports = class Slugger {
      constructor() {
        this.seen = {};
      }
      serialize(value) {
        return value.toLowerCase().trim().replace(/<[!\/a-z].*?>/ig, "").replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "").replace(/\s/g, "-");
      }
      getNextSafeSlug(originalSlug, isDryRun) {
        let slug = originalSlug;
        let occurenceAccumulator = 0;
        if (this.seen.hasOwnProperty(slug)) {
          occurenceAccumulator = this.seen[originalSlug];
          do {
            occurenceAccumulator++;
            slug = originalSlug + "-" + occurenceAccumulator;
          } while (this.seen.hasOwnProperty(slug));
        }
        if (!isDryRun) {
          this.seen[originalSlug] = occurenceAccumulator;
          this.seen[slug] = 0;
        }
        return slug;
      }
      slug(value, options2 = {}) {
        const slug = this.serialize(value);
        return this.getNextSafeSlug(slug, options2.dryrun);
      }
    };
  }
});

// node_modules/marked/src/Parser.js
var require_Parser = __commonJS({
  "node_modules/marked/src/Parser.js"(exports, module2) {
    init_shims();
    var Renderer = require_Renderer();
    var TextRenderer = require_TextRenderer();
    var Slugger = require_Slugger();
    var { defaults } = require_defaults();
    var {
      unescape: unescape2
    } = require_helpers();
    module2.exports = class Parser {
      constructor(options2) {
        this.options = options2 || defaults;
        this.options.renderer = this.options.renderer || new Renderer();
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
        this.textRenderer = new TextRenderer();
        this.slugger = new Slugger();
      }
      static parse(tokens, options2) {
        const parser = new Parser(options2);
        return parser.parse(tokens);
      }
      static parseInline(tokens, options2) {
        const parser = new Parser(options2);
        return parser.parseInline(tokens);
      }
      parse(tokens, top = true) {
        let out = "", i, j, k, l2, l3, row, cell, header, body, token, ordered, start, loose, itemBody, item, checked, task, checkbox, ret;
        const l = tokens.length;
        for (i = 0; i < l; i++) {
          token = tokens[i];
          if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
            ret = this.options.extensions.renderers[token.type].call(this, token);
            if (ret !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(token.type)) {
              out += ret || "";
              continue;
            }
          }
          switch (token.type) {
            case "space": {
              continue;
            }
            case "hr": {
              out += this.renderer.hr();
              continue;
            }
            case "heading": {
              out += this.renderer.heading(this.parseInline(token.tokens), token.depth, unescape2(this.parseInline(token.tokens, this.textRenderer)), this.slugger);
              continue;
            }
            case "code": {
              out += this.renderer.code(token.text, token.lang, token.escaped);
              continue;
            }
            case "table": {
              header = "";
              cell = "";
              l2 = token.header.length;
              for (j = 0; j < l2; j++) {
                cell += this.renderer.tablecell(this.parseInline(token.tokens.header[j]), { header: true, align: token.align[j] });
              }
              header += this.renderer.tablerow(cell);
              body = "";
              l2 = token.cells.length;
              for (j = 0; j < l2; j++) {
                row = token.tokens.cells[j];
                cell = "";
                l3 = row.length;
                for (k = 0; k < l3; k++) {
                  cell += this.renderer.tablecell(this.parseInline(row[k]), { header: false, align: token.align[k] });
                }
                body += this.renderer.tablerow(cell);
              }
              out += this.renderer.table(header, body);
              continue;
            }
            case "blockquote": {
              body = this.parse(token.tokens);
              out += this.renderer.blockquote(body);
              continue;
            }
            case "list": {
              ordered = token.ordered;
              start = token.start;
              loose = token.loose;
              l2 = token.items.length;
              body = "";
              for (j = 0; j < l2; j++) {
                item = token.items[j];
                checked = item.checked;
                task = item.task;
                itemBody = "";
                if (item.task) {
                  checkbox = this.renderer.checkbox(checked);
                  if (loose) {
                    if (item.tokens.length > 0 && item.tokens[0].type === "text") {
                      item.tokens[0].text = checkbox + " " + item.tokens[0].text;
                      if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
                        item.tokens[0].tokens[0].text = checkbox + " " + item.tokens[0].tokens[0].text;
                      }
                    } else {
                      item.tokens.unshift({
                        type: "text",
                        text: checkbox
                      });
                    }
                  } else {
                    itemBody += checkbox;
                  }
                }
                itemBody += this.parse(item.tokens, loose);
                body += this.renderer.listitem(itemBody, task, checked);
              }
              out += this.renderer.list(body, ordered, start);
              continue;
            }
            case "html": {
              out += this.renderer.html(token.text);
              continue;
            }
            case "paragraph": {
              out += this.renderer.paragraph(this.parseInline(token.tokens));
              continue;
            }
            case "text": {
              body = token.tokens ? this.parseInline(token.tokens) : token.text;
              while (i + 1 < l && tokens[i + 1].type === "text") {
                token = tokens[++i];
                body += "\n" + (token.tokens ? this.parseInline(token.tokens) : token.text);
              }
              out += top ? this.renderer.paragraph(body) : body;
              continue;
            }
            default: {
              const errMsg = 'Token with "' + token.type + '" type was not found.';
              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
          }
        }
        return out;
      }
      parseInline(tokens, renderer) {
        renderer = renderer || this.renderer;
        let out = "", i, token, ret;
        const l = tokens.length;
        for (i = 0; i < l; i++) {
          token = tokens[i];
          if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
            ret = this.options.extensions.renderers[token.type].call(this, token);
            if (ret !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(token.type)) {
              out += ret || "";
              continue;
            }
          }
          switch (token.type) {
            case "escape": {
              out += renderer.text(token.text);
              break;
            }
            case "html": {
              out += renderer.html(token.text);
              break;
            }
            case "link": {
              out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
              break;
            }
            case "image": {
              out += renderer.image(token.href, token.title, token.text);
              break;
            }
            case "strong": {
              out += renderer.strong(this.parseInline(token.tokens, renderer));
              break;
            }
            case "em": {
              out += renderer.em(this.parseInline(token.tokens, renderer));
              break;
            }
            case "codespan": {
              out += renderer.codespan(token.text);
              break;
            }
            case "br": {
              out += renderer.br();
              break;
            }
            case "del": {
              out += renderer.del(this.parseInline(token.tokens, renderer));
              break;
            }
            case "text": {
              out += renderer.text(token.text);
              break;
            }
            default: {
              const errMsg = 'Token with "' + token.type + '" type was not found.';
              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
          }
        }
        return out;
      }
    };
  }
});

// node_modules/marked/src/marked.js
var require_marked = __commonJS({
  "node_modules/marked/src/marked.js"(exports, module2) {
    init_shims();
    var Lexer = require_Lexer();
    var Parser = require_Parser();
    var Tokenizer = require_Tokenizer();
    var Renderer = require_Renderer();
    var TextRenderer = require_TextRenderer();
    var Slugger = require_Slugger();
    var {
      merge,
      checkSanitizeDeprecation,
      escape: escape3
    } = require_helpers();
    var {
      getDefaults,
      changeDefaults,
      defaults
    } = require_defaults();
    function marked2(src2, opt, callback) {
      if (typeof src2 === "undefined" || src2 === null) {
        throw new Error("marked(): input parameter is undefined or null");
      }
      if (typeof src2 !== "string") {
        throw new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src2) + ", string expected");
      }
      if (typeof opt === "function") {
        callback = opt;
        opt = null;
      }
      opt = merge({}, marked2.defaults, opt || {});
      checkSanitizeDeprecation(opt);
      if (callback) {
        const highlight = opt.highlight;
        let tokens;
        try {
          tokens = Lexer.lex(src2, opt);
        } catch (e) {
          return callback(e);
        }
        const done = function(err) {
          let out;
          if (!err) {
            try {
              if (opt.walkTokens) {
                marked2.walkTokens(tokens, opt.walkTokens);
              }
              out = Parser.parse(tokens, opt);
            } catch (e) {
              err = e;
            }
          }
          opt.highlight = highlight;
          return err ? callback(err) : callback(null, out);
        };
        if (!highlight || highlight.length < 3) {
          return done();
        }
        delete opt.highlight;
        if (!tokens.length)
          return done();
        let pending = 0;
        marked2.walkTokens(tokens, function(token) {
          if (token.type === "code") {
            pending++;
            setTimeout(() => {
              highlight(token.text, token.lang, function(err, code) {
                if (err) {
                  return done(err);
                }
                if (code != null && code !== token.text) {
                  token.text = code;
                  token.escaped = true;
                }
                pending--;
                if (pending === 0) {
                  done();
                }
              });
            }, 0);
          }
        });
        if (pending === 0) {
          done();
        }
        return;
      }
      try {
        const tokens = Lexer.lex(src2, opt);
        if (opt.walkTokens) {
          marked2.walkTokens(tokens, opt.walkTokens);
        }
        return Parser.parse(tokens, opt);
      } catch (e) {
        e.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (opt.silent) {
          return "<p>An error occurred:</p><pre>" + escape3(e.message + "", true) + "</pre>";
        }
        throw e;
      }
    }
    marked2.options = marked2.setOptions = function(opt) {
      merge(marked2.defaults, opt);
      changeDefaults(marked2.defaults);
      return marked2;
    };
    marked2.getDefaults = getDefaults;
    marked2.defaults = defaults;
    marked2.use = function(...args) {
      const opts = merge({}, ...args);
      const extensions = marked2.defaults.extensions || { renderers: {}, childTokens: {} };
      let hasExtensions;
      args.forEach((pack) => {
        if (pack.extensions) {
          hasExtensions = true;
          pack.extensions.forEach((ext) => {
            if (!ext.name) {
              throw new Error("extension name required");
            }
            if (ext.renderer) {
              const prevRenderer = extensions.renderers ? extensions.renderers[ext.name] : null;
              if (prevRenderer) {
                extensions.renderers[ext.name] = function(...args2) {
                  let ret = ext.renderer.apply(this, args2);
                  if (ret === false) {
                    ret = prevRenderer.apply(this, args2);
                  }
                  return ret;
                };
              } else {
                extensions.renderers[ext.name] = ext.renderer;
              }
            }
            if (ext.tokenizer) {
              if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
                throw new Error("extension level must be 'block' or 'inline'");
              }
              if (extensions[ext.level]) {
                extensions[ext.level].unshift(ext.tokenizer);
              } else {
                extensions[ext.level] = [ext.tokenizer];
              }
              if (ext.start) {
                if (ext.level === "block") {
                  if (extensions.startBlock) {
                    extensions.startBlock.push(ext.start);
                  } else {
                    extensions.startBlock = [ext.start];
                  }
                } else if (ext.level === "inline") {
                  if (extensions.startInline) {
                    extensions.startInline.push(ext.start);
                  } else {
                    extensions.startInline = [ext.start];
                  }
                }
              }
            }
            if (ext.childTokens) {
              extensions.childTokens[ext.name] = ext.childTokens;
            }
          });
        }
        if (pack.renderer) {
          const renderer = marked2.defaults.renderer || new Renderer();
          for (const prop in pack.renderer) {
            const prevRenderer = renderer[prop];
            renderer[prop] = (...args2) => {
              let ret = pack.renderer[prop].apply(renderer, args2);
              if (ret === false) {
                ret = prevRenderer.apply(renderer, args2);
              }
              return ret;
            };
          }
          opts.renderer = renderer;
        }
        if (pack.tokenizer) {
          const tokenizer = marked2.defaults.tokenizer || new Tokenizer();
          for (const prop in pack.tokenizer) {
            const prevTokenizer = tokenizer[prop];
            tokenizer[prop] = (...args2) => {
              let ret = pack.tokenizer[prop].apply(tokenizer, args2);
              if (ret === false) {
                ret = prevTokenizer.apply(tokenizer, args2);
              }
              return ret;
            };
          }
          opts.tokenizer = tokenizer;
        }
        if (pack.walkTokens) {
          const walkTokens = marked2.defaults.walkTokens;
          opts.walkTokens = (token) => {
            pack.walkTokens.call(this, token);
            if (walkTokens) {
              walkTokens(token);
            }
          };
        }
        if (hasExtensions) {
          opts.extensions = extensions;
        }
        marked2.setOptions(opts);
      });
    };
    marked2.walkTokens = function(tokens, callback) {
      for (const token of tokens) {
        callback(token);
        switch (token.type) {
          case "table": {
            for (const cell of token.tokens.header) {
              marked2.walkTokens(cell, callback);
            }
            for (const row of token.tokens.cells) {
              for (const cell of row) {
                marked2.walkTokens(cell, callback);
              }
            }
            break;
          }
          case "list": {
            marked2.walkTokens(token.items, callback);
            break;
          }
          default: {
            if (marked2.defaults.extensions && marked2.defaults.extensions.childTokens && marked2.defaults.extensions.childTokens[token.type]) {
              marked2.defaults.extensions.childTokens[token.type].forEach(function(childTokens) {
                marked2.walkTokens(token[childTokens], callback);
              });
            } else if (token.tokens) {
              marked2.walkTokens(token.tokens, callback);
            }
          }
        }
      }
    };
    marked2.parseInline = function(src2, opt) {
      if (typeof src2 === "undefined" || src2 === null) {
        throw new Error("marked.parseInline(): input parameter is undefined or null");
      }
      if (typeof src2 !== "string") {
        throw new Error("marked.parseInline(): input parameter is of type " + Object.prototype.toString.call(src2) + ", string expected");
      }
      opt = merge({}, marked2.defaults, opt || {});
      checkSanitizeDeprecation(opt);
      try {
        const tokens = Lexer.lexInline(src2, opt);
        if (opt.walkTokens) {
          marked2.walkTokens(tokens, opt.walkTokens);
        }
        return Parser.parseInline(tokens, opt);
      } catch (e) {
        e.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (opt.silent) {
          return "<p>An error occurred:</p><pre>" + escape3(e.message + "", true) + "</pre>";
        }
        throw e;
      }
    };
    marked2.Parser = Parser;
    marked2.parser = Parser.parse;
    marked2.Renderer = Renderer;
    marked2.TextRenderer = TextRenderer;
    marked2.Lexer = Lexer;
    marked2.lexer = Lexer.lex;
    marked2.Tokenizer = Tokenizer;
    marked2.Slugger = Slugger;
    marked2.parse = marked2;
    module2.exports = marked2;
  }
});

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();
function getRawBody(req) {
  return new Promise((fulfil, reject) => {
    const h = req.headers;
    if (!h["content-type"]) {
      return fulfil(null);
    }
    req.on("error", reject);
    const length = Number(h["content-length"]);
    if (isNaN(length) && h["transfer-encoding"] == null) {
      return fulfil(null);
    }
    let data = new Uint8Array(length || 0);
    if (length > 0) {
      let offset = 0;
      req.on("data", (chunk) => {
        const new_len = offset + Buffer.byteLength(chunk);
        if (new_len > length) {
          return reject({
            status: 413,
            reason: 'Exceeded "Content-Length" limit'
          });
        }
        data.set(chunk, offset);
        offset = new_len;
      });
    } else {
      req.on("data", (chunk) => {
        const new_data = new Uint8Array(data.length + chunk.length);
        new_data.set(data, 0);
        new_data.set(chunk, data.length);
        data = new_data;
      });
    }
    req.on("end", () => {
      const [type] = h["content-type"].split(/;\s*/);
      if (type === "application/octet-stream") {
        return fulfil(data);
      }
      const encoding = h["content-encoding"] || "utf-8";
      fulfil(new TextDecoder(encoding).decode(data));
    });
  });
}

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  branch,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (branch) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${branch.map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page.path)},
						query: new URLSearchParams(${s$1(page.query.toString())}),
						params: ${s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    return body2 ? `<script type="svelte-data" url="${url}" body="${hash(body2)}">${json}<\/script>` : `<script type="svelte-data" url="${url}">${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  if (loaded.error) {
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
function resolve(base, path2) {
  const baseparts = path2[0] === "/" ? [] : base.slice(1).split("/");
  const pathparts = path2[0] === "/" ? path2.slice(1).split("/") : path2.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  return `/${baseparts.join("/")}`;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module2.load) {
    const load_input = {
      page,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        if (options2.read && url.startsWith(options2.paths.assets)) {
          url = url.replace(options2.paths.assets, "");
        }
        if (url.startsWith("//")) {
          throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
        }
        let response;
        if (/^[a-zA-Z]+:/.test(url)) {
          response = await (void 0)(url, opts);
        } else {
          const [path2, search] = url.split("?");
          const resolved = resolve(request.path, path2);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
          if (asset) {
            if (options2.read) {
              response = new (void 0)(options2.read(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await (void 0)(`http://${page.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = { ...opts.headers };
            if (opts.credentials !== "omit") {
              uses_credentials = true;
              headers.cookie = request.headers.cookie;
              if (!headers.authorization) {
                headers.authorization = request.headers.authorization;
              }
            }
            if (opts.body && typeof opts.body !== "string") {
              throw new Error("Request body must be a string");
            }
            const rendered = await respond({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              rawBody: opts.body,
              query: new URLSearchParams(search)
            }, options2, {
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (state.prerender) {
                state.prerender.dependencies.set(resolved, rendered);
              }
              response = new (void 0)(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new (void 0)("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page
    });
  } catch (error4) {
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
async function respond$1({ request, options: options2, state, $session, route }) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options2.load_component(id)));
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options2.ssr,
    router: "router" in leaf ? leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            }
          } catch (e) {
            options2.handle_error(e);
            status = 500;
            error3 = e;
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch: branch && branch.filter(Boolean),
      page
    });
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    if (state.fetched) {
      return {
        status: 500,
        headers: {},
        body: `Bad request in load function: failed to fetch ${state.fetched}`
      };
    }
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({ ...request, params });
    if (response) {
      if (typeof response !== "object") {
        return error(`Invalid response from route ${request.path}: expected an object, got ${typeof response}`);
      }
      let { status = 200, body, headers = {} } = response;
      headers = lowercase_keys(headers);
      const type = headers["content-type"];
      if (type === "application/octet-stream" && !(body instanceof Uint8Array)) {
        return error(`Invalid response from route ${request.path}: body must be an instance of Uint8Array if content type is application/octet-stream`);
      }
      if (body instanceof Uint8Array && type !== "application/octet-stream") {
        return error(`Invalid response from route ${request.path}: Uint8Array body must be accompanied by content-type: application/octet-stream header`);
      }
      let normalized_body;
      if (typeof body === "object" && (!type || type === "application/json")) {
        headers = { ...headers, "content-type": "application/json" };
        normalized_body = JSON.stringify(body);
      } else {
        normalized_body = body;
      }
      return { status, body: normalized_body, headers };
    }
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        map.get(key).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield key;
      }
    }
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value;
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const [type, ...directives] = headers["content-type"].split(/;\s*/);
  if (typeof raw === "string") {
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  const nope = () => {
    throw new Error("Malformed form data");
  };
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    nope();
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          nope();
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      nope();
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !incoming.path.split("/").pop().includes(".")) {
      const path2 = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path2 + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    const headers = lowercase_keys(incoming.headers);
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers,
        body: parse_body(incoming.rawBody, headers),
        params: null,
        locals: {}
      },
      resolve: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            error: null,
            branch: [],
            page: null
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (e) {
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// node_modules/svelte/internal/index.mjs
init_shims();
function noop2() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal2(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop2;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
  let value;
  subscribe(store, (_) => value = _)();
  return value;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
var tasks = new Set();
function custom_event(type, detail) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, false, false, detail);
  return e;
}
var active_docs = new Set();
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
var resolved_promise = Promise.resolve();
var seen_callbacks = new Set();
var outroing = new Set();
var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : global;
var boolean_attributes = new Set([
  "allowfullscreen",
  "allowpaymentrequest",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
]);
var invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
function spread(args, classes_to_add) {
  const attributes = Object.assign({}, ...args);
  if (classes_to_add) {
    if (attributes.class == null) {
      attributes.class = classes_to_add;
    } else {
      attributes.class += " " + classes_to_add;
    }
  }
  let str = "";
  Object.keys(attributes).forEach((name) => {
    if (invalid_attribute_name_character.test(name))
      return;
    const value = attributes[name];
    if (value === true)
      str += " " + name;
    else if (boolean_attributes.has(name.toLowerCase())) {
      if (value)
        str += " " + name;
    } else if (value != null) {
      str += ` ${name}="${String(value).replace(/"/g, "&#34;").replace(/'/g, "&#39;")}"`;
    }
  });
  return str;
}
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      const { on_mount } = this.$$;
      this.$$.on_disconnect = on_mount.map(run).filter(is_function);
      for (const key in this.$$.slotted) {
        this.appendChild(this.$$.slotted[key]);
      }
    }
    attributeChangedCallback(attr, _oldValue, newValue) {
      this[attr] = newValue;
    }
    disconnectedCallback() {
      run_all(this.$$.on_disconnect);
    }
    $destroy() {
      destroy_component(this, 1);
      this.$destroy = noop2;
    }
    $on(type, callback) {
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index2 = callbacks.indexOf(callback);
        if (index2 !== -1)
          callbacks.splice(index2, 1);
      };
    }
    $set($$props) {
      if (this.$$set && !is_empty($$props)) {
        this.$$.skip_bound = true;
        this.$$set($$props);
        this.$$.skip_bound = false;
      }
    }
  };
}

// node_modules/svelte/index.mjs
init_shims();

// .svelte-kit/output/server/app.js
var import_js_yaml = __toModule(require_js_yaml2());
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));

// node_modules/svelte/store/index.mjs
init_shims();
var subscriber_queue2 = [];
function readable(value, start) {
  return {
    subscribe: writable2(value, start).subscribe
  };
}
function writable2(value, start = noop2) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal2(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue2.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue2.length; i += 2) {
            subscriber_queue2[i][0](subscriber_queue2[i + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop2) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop2;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}

// .svelte-kit/output/server/app.js
var import_marked = __toModule(require_marked());
var css$i = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$i);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `${escape2(title)}` : ``}</div>` : ``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body id="svelte">\n		' + body + "\n	</body>\n</html>\n";
var options = null;
function init(settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-d8d57b37.js",
      css: ["/./_app/assets/start-a8cd1609.css"],
      js: ["/./_app/start-d8d57b37.js", "/./_app/chunks/vendor-47cffbd8.js", "/./_app/chunks/preload-helper-9f12a5fd.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var d = decodeURIComponent;
var empty = () => ({});
var manifest = {
  assets: [],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/projects\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/projects/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/projects\/([^/]+?)\/?$/,
      params: (m) => ({ slug: d(m[1]) }),
      a: ["src/routes/__layout.svelte", "src/routes/projects/[slug].svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/archive\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/archive/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/data\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return index_json$2;
      })
    },
    {
      type: "page",
      pattern: /^\/data\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/data/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/data\/projects\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return index_json$1;
      })
    },
    {
      type: "endpoint",
      pattern: /^\/data\/projects\/([^/]+?)\.json$/,
      params: (m) => ({ slug: d(m[1]) }),
      load: () => Promise.resolve().then(function() {
        return _slug__json$1;
      })
    },
    {
      type: "endpoint",
      pattern: /^\/data\/info\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return index_json;
      })
    },
    {
      type: "endpoint",
      pattern: /^\/data\/info\/([^/]+?)\.json$/,
      params: (m) => ({ slug: d(m[1]) }),
      load: () => Promise.resolve().then(function() {
        return _slug__json;
      })
    },
    {
      type: "page",
      pattern: /^\/info\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/info/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request))
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$4;
  }),
  "src/routes/projects/index.svelte": () => Promise.resolve().then(function() {
    return index$3;
  }),
  "src/routes/projects/[slug].svelte": () => Promise.resolve().then(function() {
    return _slug_;
  }),
  "src/routes/archive/index.svelte": () => Promise.resolve().then(function() {
    return index$2;
  }),
  "src/routes/data/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/info/index.svelte": () => Promise.resolve().then(function() {
    return index;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-cf59d2b7.js", "css": ["/./_app/assets/pages/__layout.svelte-6df4573c.css"], "js": ["/./_app/pages/__layout.svelte-cf59d2b7.js", "/./_app/chunks/vendor-47cffbd8.js"], "styles": null }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-01323bae.js", "css": [], "js": ["/./_app/error.svelte-01323bae.js", "/./_app/chunks/vendor-47cffbd8.js"], "styles": null }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-92c60b01.js", "css": ["/./_app/assets/pages/index.svelte-72914b1c.css", "/./_app/assets/Sidebar-8be8e3a8.css", "/./_app/assets/Project-b75cf7c9.css"], "js": ["/./_app/pages/index.svelte-92c60b01.js", "/./_app/chunks/vendor-47cffbd8.js", "/./_app/chunks/Sidebar-c16cc1a1.js", "/./_app/chunks/Project-bb81a175.js"], "styles": null }, "src/routes/projects/index.svelte": { "entry": "/./_app/pages/projects/index.svelte-d54e7b48.js", "css": ["/./_app/assets/pages/projects/index.svelte-1badafdf.css"], "js": ["/./_app/pages/projects/index.svelte-d54e7b48.js", "/./_app/chunks/vendor-47cffbd8.js"], "styles": null }, "src/routes/projects/[slug].svelte": { "entry": "/./_app/pages/projects/[slug].svelte-fa12ae47.js", "css": ["/./_app/assets/pages/projects/[slug].svelte-de858e50.css", "/./_app/assets/Project-b75cf7c9.css"], "js": ["/./_app/pages/projects/[slug].svelte-fa12ae47.js", "/./_app/chunks/vendor-47cffbd8.js", "/./_app/chunks/Project-bb81a175.js"], "styles": null }, "src/routes/archive/index.svelte": { "entry": "/./_app/pages/archive/index.svelte-30980f35.js", "css": ["/./_app/assets/pages/archive/index.svelte-b56b8af8.css", "/./_app/assets/Project-b75cf7c9.css"], "js": ["/./_app/pages/archive/index.svelte-30980f35.js", "/./_app/chunks/preload-helper-9f12a5fd.js", "/./_app/chunks/vendor-47cffbd8.js", "/./_app/chunks/Project-bb81a175.js"], "styles": null }, "src/routes/data/index.svelte": { "entry": "/./_app/pages/data/index.svelte-be00adae.js", "css": [], "js": ["/./_app/pages/data/index.svelte-be00adae.js", "/./_app/chunks/vendor-47cffbd8.js"], "styles": null }, "src/routes/info/index.svelte": { "entry": "/./_app/pages/info/index.svelte-b7f0c30f.js", "css": ["/./_app/assets/pages/info/index.svelte-9296667a.css", "/./_app/assets/Sidebar-8be8e3a8.css"], "js": ["/./_app/pages/info/index.svelte-b7f0c30f.js", "/./_app/chunks/vendor-47cffbd8.js", "/./_app/chunks/Sidebar-c16cc1a1.js"], "styles": null } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
init({ paths: { "base": "", "assets": "/." } });
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var extractFrontMatter$2 = (markdown) => {
  const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);
  if (match) {
    const frontmatter = import_js_yaml.default.load(match[1]);
    const content = markdown.slice(match[0].length).trim();
    return { frontmatter, content };
  }
  return { frontmatter: [], content: markdown };
};
var getProject$1 = (filename) => {
  try {
    const rawProjectData = import_fs.default.readFileSync(import_path.default.resolve("./public", `projects/${filename}`), "utf-8");
    return extractFrontMatter$2(rawProjectData);
  } catch (e) {
    return [];
  }
};
var getProjects$1 = () => {
  try {
    return import_fs.default.readdirSync(import_path.default.resolve("./public", "projects")).reduce((projects, filename) => {
      const slug = import_path.default.parse(filename).name;
      if (!slug.startsWith(".")) {
        projects[slug] = getProject$1(filename);
      }
      return projects;
    }, {});
  } catch (e) {
    return [];
  }
};
var getInfo$1 = (slug) => {
  try {
    const rawInfoData = import_fs.default.readFileSync(import_path.default.resolve("./public", `info/${slug}`), "utf-8");
    return extractFrontMatter$2(rawInfoData);
  } catch (e) {
    return [];
  }
};
var getInfoList$1 = () => {
  try {
    return import_fs.default.readdirSync(import_path.default.resolve("./public", "info")).reduce((infoList, filename) => {
      const slug = import_path.default.parse(filename).name;
      if (!slug.startsWith(".")) {
        infoList[slug] = getInfo$1(filename);
      }
      return infoList;
    }, {});
  } catch (e) {
    return [];
  }
};
async function get$4({ params }) {
  const projects = getProjects$1();
  const info = getInfoList$1();
  return {
    body: {
      projects,
      info
    }
  };
}
var index_json$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$4
});
var getProjects = () => {
  try {
    return import_fs.default.readdirSync("./static/projects").reduce((list, filename) => {
      if (!import_path.default.parse(filename).name.startsWith(".")) {
        list.push(import_path.default.parse(filename).name);
      }
      return list;
    }, []);
  } catch (e) {
    return [];
  }
};
async function get$3({ params }) {
  const projects = getProjects();
  return {
    body: {
      projects
    }
  };
}
var index_json$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$3
});
var extractFrontMatter$1 = (markdown) => {
  const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);
  if (match) {
    const frontmatter = import_js_yaml.default.load(match[1]);
    const content = markdown.slice(match[0].length).trim();
    return { frontmatter, content };
  }
  return { frontmatter: [], content: markdown };
};
var getProject = (slug) => {
  try {
    const rawProjectData = import_fs.default.readFileSync(import_path.default.resolve(`./static/projects/${slug}.md`), "utf-8");
    return extractFrontMatter$1(rawProjectData);
  } catch (e) {
    return [];
  }
};
async function get$2({ params }) {
  const { slug } = params;
  const { frontmatter, content } = getProject(slug);
  return {
    body: {
      frontmatter,
      content
    }
  };
}
var _slug__json$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$2
});
var getInfoList = () => {
  try {
    return import_fs.default.readdirSync(import_path.default.resolve("./public", "info")).reduce((list, filename) => {
      if (!import_path.default.parse(filename).name.startsWith(".")) {
        list.push(import_path.default.parse(filename).name);
      }
      return list;
    }, []);
  } catch (e) {
    return [];
  }
};
async function get$1({ params }) {
  const info = getInfoList();
  return {
    body: {
      info
    }
  };
}
var index_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$1
});
var extractFrontMatter = (markdown) => {
  const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);
  if (match) {
    const frontmatter = import_js_yaml.default.load(match[1]);
    const content = markdown.slice(match[0].length).trim();
    return { frontmatter, content };
  }
  return { frontmatter: [], content: markdown };
};
var getInfo = (slug) => {
  try {
    const rawInfoData = import_fs.default.readFileSync(import_path.default.resolve("./public", `info/${slug}.md`), "utf-8");
    return extractFrontMatter(rawInfoData);
  } catch (e) {
    return [];
  }
};
async function get({ params }) {
  const { slug } = params;
  const { frontmatter, content } = getInfo(slug);
  return {
    body: {
      frontmatter,
      content
    }
  };
}
var _slug__json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get
});
var css$h = {
  code: "h1.svelte-1gzebpa.svelte-1gzebpa{margin:1rem;letter-spacing:.5px}h1.svelte-1gzebpa a.svelte-1gzebpa:hover{text-decoration:none;-webkit-text-fill-color:var(--black)}nav.svelte-1gzebpa.svelte-1gzebpa{margin:1rem;font-size:4rem;letter-spacing:-1.4px}header.svelte-1gzebpa.svelte-1gzebpa{display:flex;flex-direction:row;justify-content:space-between;align-items:center;border-bottom:var(--border)}",
  map: '{"version":3,"file":"Header.svelte","sources":["Header.svelte"],"sourcesContent":["<header>\\n  <h1>\\n    <a href=\\"/\\" class=\\"outline\\">How toGether</a>\\n  </h1>\\n  <nav>\\n    <a class=\\"outline\\" href=\\"/info\\">info</a>\\n    <a class=\\"outline\\" href=\\"/archive\\">archive</a>\\n  </nav>\\n</header>\\n\\n<style>\\n  h1 {\\n    margin: 1rem;\\n    letter-spacing: .5px;\\n  }\\n\\n  h1 a:hover {\\n    text-decoration: none;\\n    -webkit-text-fill-color: var(--black);\\n  }\\n\\n  nav {\\n    margin: 1rem;\\n    font-size: 4rem;\\n    letter-spacing: -1.4px;\\n  }\\n\\n  header {\\n    display: flex;\\n    flex-direction: row;\\n    justify-content: space-between;\\n    align-items: center;\\n\\n    border-bottom: var(--border);\\n  }\\n</style>"],"names":[],"mappings":"AAWE,EAAE,8BAAC,CAAC,AACF,MAAM,CAAE,IAAI,CACZ,cAAc,CAAE,IAAI,AACtB,CAAC,AAED,iBAAE,CAAC,gBAAC,MAAM,AAAC,CAAC,AACV,eAAe,CAAE,IAAI,CACrB,uBAAuB,CAAE,IAAI,OAAO,CAAC,AACvC,CAAC,AAED,GAAG,8BAAC,CAAC,AACH,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,IAAI,CACf,cAAc,CAAE,MAAM,AACxB,CAAC,AAED,MAAM,8BAAC,CAAC,AACN,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,CACnB,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,CAEnB,aAAa,CAAE,IAAI,QAAQ,CAAC,AAC9B,CAAC"}'
};
var Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$h);
  return `<header class="${"svelte-1gzebpa"}"><h1 class="${"svelte-1gzebpa"}"><a href="${"/"}" class="${"outline svelte-1gzebpa"}">How toGether</a></h1>
  <nav class="${"svelte-1gzebpa"}"><a class="${"outline"}" href="${"/info"}">info</a>
    <a class="${"outline"}" href="${"/archive"}">archive</a></nav>
</header>`;
});
var css$g = {
  code: "body{display:flex;flex-direction:column}main.svelte-12ht93u{min-height:0;flex-grow:1;display:flex;flex-direction:row}",
  map: `{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script>\\n  import Header from '$lib/elements/Header.svelte';\\n  import '../css/app.css'\\n  import '../css/type.css'\\n<\/script>\\n\\n<Header />\\n<main>\\n  <slot />\\n</main>\\n\\n<style>\\n  :global(body) {\\n    display: flex;\\n    flex-direction: column;\\n  }\\n\\n  main {\\n    min-height: 0;\\n    flex-grow: 1;\\n    display: flex;\\n    flex-direction: row;\\n  }\\n</style>"],"names":[],"mappings":"AAYU,IAAI,AAAE,CAAC,AACb,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,AACxB,CAAC,AAED,IAAI,eAAC,CAAC,AACJ,UAAU,CAAE,CAAC,CACb,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,AACrB,CAAC"}`
};
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$g);
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}
<main class="${"svelte-12ht93u"}">${slots.default ? slots.default({}) : ``}
</main>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load$5({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<p>${escape2(error22.message)}</p>


${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load: load$5
});
var css$f = {
  code: "label.svelte-1aoxg1t{width:100%;line-height:20px;display:flex;flex-direction:row;align-items:center;margin:0;cursor:pointer;position:relative;user-select:none;-webkit-user-select:none;-moz-user-select:none}input.svelte-1aoxg1t{position:absolute;left:0;right:0;top:0;bottom:0;opacity:0;margin:0;padding:0}.box.svelte-1aoxg1t{width:10px;height:10px;margin-right:0.25rem}.label.svelte-1aoxg1t{height:100%;flex-grow:1;margin-left:4px}",
  map: `{"version":3,"file":"Checkbox.svelte","sources":["Checkbox.svelte"],"sourcesContent":["<script>\\n  export let checked = false;\\n  export let disabled = false;\\n<\/script>\\n\\n<label>\\n  <input type=\\"checkbox\\" bind:checked {disabled} />\\n\\n  <div\\n    class=\\"box\\"\\n    style=\\"\\n      background-color: {disabled\\n      ? '#999'\\n      : checked\\n      ? 'black'\\n      : 'white'};\\n      border: 2px solid {disabled ? '#999' : 'black'};\\n    \\"\\n  />\\n\\n  <div class=\\"label\\"><slot /></div>\\n</label>\\n\\n<style>\\n  label {\\n    width: 100%;\\n    line-height: 20px;\\n    display: flex;\\n    flex-direction: row;\\n    align-items: center;\\n    margin: 0;\\n    cursor: pointer;\\n    position: relative;\\n    user-select: none;\\n    -webkit-user-select: none;\\n    -moz-user-select: none;\\n  }\\n\\n  input {\\n    position: absolute;\\n    left: 0;\\n    right: 0;\\n    top: 0;\\n    bottom: 0;\\n    opacity: 0;\\n    margin: 0;\\n    padding: 0;\\n  }\\n\\n  .box {\\n    width: 10px;\\n    height: 10px;\\n    margin-right: 0.25rem;\\n  }\\n\\n  .label {\\n    height: 100%;\\n    flex-grow: 1;\\n    margin-left: 4px;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAwBE,KAAK,eAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,CACnB,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,OAAO,CACf,QAAQ,CAAE,QAAQ,CAClB,WAAW,CAAE,IAAI,CACjB,mBAAmB,CAAE,IAAI,CACzB,gBAAgB,CAAE,IAAI,AACxB,CAAC,AAED,KAAK,eAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,GAAG,CAAE,CAAC,CACN,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,IAAI,eAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,YAAY,CAAE,OAAO,AACvB,CAAC,AAED,MAAM,eAAC,CAAC,AACN,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,CAAC,CACZ,WAAW,CAAE,GAAG,AAClB,CAAC"}`
};
var Checkbox = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { checked = false } = $$props;
  let { disabled = false } = $$props;
  if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0)
    $$bindings.checked(checked);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  $$result.css.add(css$f);
  return `<label class="${"svelte-1aoxg1t"}"><input type="${"checkbox"}" ${disabled ? "disabled" : ""} class="${"svelte-1aoxg1t"}"${add_attribute("checked", checked, 1)}>

  <div class="${"box svelte-1aoxg1t"}" style="${"\n      background-color: " + escape2(disabled ? "#999" : checked ? "black" : "white") + ";\n      border: 2px solid " + escape2(disabled ? "#999" : "black") + ";\n    "}"></div>

  <div class="${"label svelte-1aoxg1t"}">${slots.default ? slots.default({}) : ``}</div>
</label>`;
});
var meeting = writable2(true);
var coworking = writable2(true);
var common = writable2(true);
var atelier = writable2(true);
var round = (n, m) => {
  return Math.round(n * 10 ** m) / 10 ** m;
};
var config = {
  bgWidth: 15188,
  bgHeight: 1e4,
  startX: 7200,
  startY: 4800,
  moveStep: 50,
  startZoom: 1,
  zoomStep: 0.2,
  minZoom: 0.4,
  maxZoom: 4
};
function createScale(config2) {
  const { subscribe: subscribe2, set, update } = writable2(config2.startZoom);
  const zoom = (n = config2.zoomStep) => update((scale2) => {
    scale2 += n;
    scale2 = scale2 <= config2.minZoom ? config2.minZoom : scale2;
    scale2 = scale2 >= config2.maxZoom ? config2.maxZoom : scale2;
    return round(scale2, 2);
  });
  const zoomIn = () => zoom();
  const zoomOut = () => zoom(-config2.zoomStep);
  const reset = () => set(config2.startZoom);
  return {
    subscribe: subscribe2,
    zoom,
    zoomIn,
    zoomOut,
    reset
  };
}
function createPos(config2, viewport2, scale2) {
  const { subscribe: subscribe2, set, update } = writable2({ x: config2.startX, y: config2.startY });
  const updateMinMax = () => {
    let $viewport = get_store_value(viewport2);
    let $scale = get_store_value(scale2);
    let minX = 0;
    let minY = 0;
    let maxX = config2.bgWidth * $scale - $viewport.width;
    let maxY = config2.bgHeight * $scale - $viewport.height;
    return { minX, minY, maxX, maxY };
  };
  const move = ({ x = 0, y = 0 }) => update((pos2) => {
    let { minX, minY, maxX, maxY } = updateMinMax();
    pos2.x += x;
    pos2.y += y;
    pos2.x = pos2.x <= minX ? minX : pos2.x;
    pos2.x = pos2.x >= maxX ? maxX : pos2.x;
    pos2.y = pos2.y <= minY ? minY : pos2.y;
    pos2.y = pos2.y >= maxY ? maxY : pos2.y;
    return pos2;
  });
  const moveTo = ({ x = 0, y = 0 }) => {
    let { minX, minY, maxX, maxY } = updateMinMax();
    x = x <= minX ? minX : x;
    y = y <= minY ? minY : y;
    x = x >= maxX ? maxX : x;
    y = y >= maxY ? maxY : y;
    set({ x, y });
  };
  const moveRight = (n = config2.moveStep) => move({ x: +n });
  const moveLeft = (n = config2.moveStep) => move({ x: -n });
  const moveUp = (n = config2.moveStep) => move({ y: -n });
  const moveDown = (n = config2.moveStep) => move({ y: n });
  const reset = () => moveTo({ x: config2.startX, y: config2.startY });
  return {
    subscribe: subscribe2,
    moveRight,
    moveLeft,
    moveUp,
    moveDown,
    moveTo,
    reset
  };
}
var size = readable({
  width: config.bgWidth,
  height: config.bgHeight
});
var viewport = writable2({
  width: 1e3,
  height: 1e3
});
var scale = createScale(config);
var pos = createPos(config, viewport, scale);
var dragging = writable2(false);
var moved = writable2(false);
var detailsVisible = writable2(false);
var detailsProject = writable2();
readable({ x: 0, y: 0 }, (set) => {
  document.body.addEventListener("mousemove", move);
  function move(event) {
    set({
      x: event.clientX,
      y: event.clientY
    });
  }
  return () => {
    document.body.removeEventListener("mousemove", move);
  };
});
readable({ width: 0, height: 0 }, (set) => {
  window.addEventListener("resize", resize);
  function resize() {
    set({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }
  return () => {
    window.removeEventListener("resize", resize);
  };
});
var css$e = {
  code: '.filters.svelte-7xyth3.svelte-7xyth3{border-right:1px solid black;background-color:white;height:100%;width:100%;overflow-y:auto}header.svelte-7xyth3.svelte-7xyth3{display:flex;align-items:center;font-weight:bold;color:black;margin:24px 16px 8px 16px;border-bottom:1px solid black}header.svelte-7xyth3 span.svelte-7xyth3{margin-bottom:4px}ul.svelte-7xyth3.svelte-7xyth3{list-style:none;padding-left:1rem}li.svelte-7xyth3.svelte-7xyth3{margin:0.25rem 0}li.action.svelte-7xyth3.svelte-7xyth3{cursor:pointer}li.action.svelte-7xyth3.svelte-7xyth3::before{content:"> ";margin-right:0.25rem}li.action.svelte-7xyth3.svelte-7xyth3:hover{font-weight:bold}li.action.disabled.svelte-7xyth3.svelte-7xyth3{opacity:0}',
  map: `{"version":3,"file":"Filters.svelte","sources":["Filters.svelte"],"sourcesContent":["<script>\\n  import Checkbox from \\"$lib/elements/Checkbox.svelte\\";\\n\\n  import { meeting, coworking, common, atelier } from \\"$lib/stores/filters\\";\\n  import { pos, scale, viewport } from \\"$lib/stores/map\\";\\n\\n  import { mouse } from \\"$lib/stores/dom\\"\\n\\n  export let projects;\\n\\n  $: checkLocation = (location) => {\\n    if (location === \\"meeting\\" && $meeting) return true;\\n    if (location === \\"coworking\\" && $coworking) return true;\\n    if (location === \\"common\\" && $common) return true;\\n    if (location === \\"atelier\\" && $atelier) return true;\\n  };\\n\\n  const goTo = (m) => {\\n    scale.reset();\\n    pos.moveTo({ x: m.frontmatter.coordinates.x, y: m.frontmatter.coordinates.y });\\n  };\\n<\/script>\\n\\n<div class=\\"filters\\">\\n  <header><span>Location</span></header>\\n  <ul>\\n    <li><Checkbox bind:checked={$meeting}>Meeting Space</Checkbox></li>\\n    <li><Checkbox bind:checked={$coworking}>Co-working Space</Checkbox></li>\\n    <li><Checkbox bind:checked={$common}>Common Space</Checkbox></li>\\n    <li><Checkbox bind:checked={$atelier}>Atelier</Checkbox></li>\\n  </ul>\\n  <header><span>Action</span></header>\\n  <ul>\\n    {#each Object.values(projects) as project }\\n      <li\\n        class=\\"action {checkLocation(project.frontmatter.location) ? '' : 'disabled'}\\"\\n        on:click={goTo(project)}\\n      >\\n        {project.frontmatter.action}\\n      </li>\\n    {/each}\\n  </ul>\\n</div>\\n\\n<style>\\n  .filters {\\n    border-right: 1px solid black;\\n    background-color: white;\\n    height: 100%;\\n    width: 100%;\\n    overflow-y: auto;\\n  }\\n\\n  header {\\n    display: flex;\\n    align-items: center;\\n    font-weight: bold;\\n    color: black;\\n    margin: 24px 16px 8px 16px;\\n    border-bottom: 1px solid black;\\n  }\\n\\n  header span {\\n    margin-bottom: 4px;\\n  }\\n\\n  ul {\\n    list-style: none;\\n    padding-left: 1rem;\\n  }\\n\\n  li {\\n    margin: 0.25rem 0;\\n  }\\n\\n  li.action {\\n    cursor: pointer;\\n  }\\n\\n  li.action::before {\\n    content: \\"> \\";\\n    margin-right: 0.25rem;\\n  }\\n\\n  li.action:hover {\\n    font-weight: bold;\\n  }\\n\\n  li.action.disabled {\\n    opacity: 0;\\n  }\\n</style>\\n"],"names":[],"mappings":"AA6CE,QAAQ,4BAAC,CAAC,AACR,YAAY,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,CAC7B,gBAAgB,CAAE,KAAK,CACvB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,MAAM,4BAAC,CAAC,AACN,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,IAAI,CAAC,IAAI,CAAC,GAAG,CAAC,IAAI,CAC1B,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,AAChC,CAAC,AAED,oBAAM,CAAC,IAAI,cAAC,CAAC,AACX,aAAa,CAAE,GAAG,AACpB,CAAC,AAED,EAAE,4BAAC,CAAC,AACF,UAAU,CAAE,IAAI,CAChB,YAAY,CAAE,IAAI,AACpB,CAAC,AAED,EAAE,4BAAC,CAAC,AACF,MAAM,CAAE,OAAO,CAAC,CAAC,AACnB,CAAC,AAED,EAAE,OAAO,4BAAC,CAAC,AACT,MAAM,CAAE,OAAO,AACjB,CAAC,AAED,EAAE,mCAAO,QAAQ,AAAC,CAAC,AACjB,OAAO,CAAE,IAAI,CACb,YAAY,CAAE,OAAO,AACvB,CAAC,AAED,EAAE,mCAAO,MAAM,AAAC,CAAC,AACf,WAAW,CAAE,IAAI,AACnB,CAAC,AAED,EAAE,OAAO,SAAS,4BAAC,CAAC,AAClB,OAAO,CAAE,CAAC,AACZ,CAAC"}`
};
var Filters = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let checkLocation;
  let $meeting, $$unsubscribe_meeting;
  let $coworking, $$unsubscribe_coworking;
  let $common, $$unsubscribe_common;
  let $atelier, $$unsubscribe_atelier;
  $$unsubscribe_meeting = subscribe(meeting, (value) => $meeting = value);
  $$unsubscribe_coworking = subscribe(coworking, (value) => $coworking = value);
  $$unsubscribe_common = subscribe(common, (value) => $common = value);
  $$unsubscribe_atelier = subscribe(atelier, (value) => $atelier = value);
  let { projects } = $$props;
  if ($$props.projects === void 0 && $$bindings.projects && projects !== void 0)
    $$bindings.projects(projects);
  $$result.css.add(css$e);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    checkLocation = (location) => {
      if (location === "meeting" && $meeting)
        return true;
      if (location === "coworking" && $coworking)
        return true;
      if (location === "common" && $common)
        return true;
      if (location === "atelier" && $atelier)
        return true;
    };
    $$rendered = `<div class="${"filters svelte-7xyth3"}"><header class="${"svelte-7xyth3"}"><span class="${"svelte-7xyth3"}">Location</span></header>
  <ul class="${"svelte-7xyth3"}"><li class="${"svelte-7xyth3"}">${validate_component(Checkbox, "Checkbox").$$render($$result, { checked: $meeting }, {
      checked: ($$value) => {
        $meeting = $$value;
        $$settled = false;
      }
    }, { default: () => `Meeting Space` })}</li>
    <li class="${"svelte-7xyth3"}">${validate_component(Checkbox, "Checkbox").$$render($$result, { checked: $coworking }, {
      checked: ($$value) => {
        $coworking = $$value;
        $$settled = false;
      }
    }, { default: () => `Co-working Space` })}</li>
    <li class="${"svelte-7xyth3"}">${validate_component(Checkbox, "Checkbox").$$render($$result, { checked: $common }, {
      checked: ($$value) => {
        $common = $$value;
        $$settled = false;
      }
    }, { default: () => `Common Space` })}</li>
    <li class="${"svelte-7xyth3"}">${validate_component(Checkbox, "Checkbox").$$render($$result, { checked: $atelier }, {
      checked: ($$value) => {
        $atelier = $$value;
        $$settled = false;
      }
    }, { default: () => `Atelier` })}</li></ul>
  <header class="${"svelte-7xyth3"}"><span class="${"svelte-7xyth3"}">Action</span></header>
  <ul class="${"svelte-7xyth3"}">${each(Object.values(projects), (project) => `<li class="${"action " + escape2(checkLocation(project.frontmatter.location) ? "" : "disabled") + " svelte-7xyth3"}">${escape2(project.frontmatter.action)}
      </li>`)}</ul>
</div>`;
  } while (!$$settled);
  $$unsubscribe_meeting();
  $$unsubscribe_coworking();
  $$unsubscribe_common();
  $$unsubscribe_atelier();
  return $$rendered;
});
var css$d = {
  code: "aside.svelte-rxitd4{width:14rem;max-width:14rem;border-right:var(--border);display:flex;flex-direction:column;flex-grow:0;flex-shrink:0}",
  map: '{"version":3,"file":"Sidebar.svelte","sources":["Sidebar.svelte"],"sourcesContent":["<aside>\\n  <slot>\\n    empty sidebar\\n  </slot>\\n</aside>\\n\\n<style>\\n  aside {\\n    width: 14rem;\\n    max-width: 14rem;\\n    border-right: var(--border);\\n    display: flex;\\n    flex-direction: column;\\n    flex-grow: 0;\\n    flex-shrink: 0;\\n  }\\n</style>"],"names":[],"mappings":"AAOE,KAAK,cAAC,CAAC,AACL,KAAK,CAAE,KAAK,CACZ,SAAS,CAAE,KAAK,CAChB,YAAY,CAAE,IAAI,QAAQ,CAAC,CAC3B,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,SAAS,CAAE,CAAC,CACZ,WAAW,CAAE,CAAC,AAChB,CAAC"}'
};
var Sidebar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$d);
  return `<aside class="${"svelte-rxitd4"}">${slots.default ? slots.default({}) : `
    empty sidebar
  `}
</aside>`;
});
var css$c = {
  code: ".marker.svelte-1v95mat{display:block;position:absolute;width:200px;height:200px;background-size:cover;background-repeat:no-repeat;margin-left:500px;transform-origin:top left}.marker.svelte-1v95mat:hover{filter:brightness(120%) drop-shadow(0.5px 0 0 black) drop-shadow(0 0.5px 0 black) drop-shadow(-0.5px 0 0 black) drop-shadow(0 -0.5px 0 black);cursor:pointer}",
  map: `{"version":3,"file":"Marker.svelte","sources":["Marker.svelte"],"sourcesContent":["<script>\\n  import { scale } from \\"$lib/stores/map\\";\\n  import { moved, detailsVisible, detailsProject } from \\"$lib/stores/map\\"\\n\\n  export let project;\\n\\n  let marker = project.frontmatter.marker\\n  let left = project.frontmatter.coordinates.x\\n  let top = project.frontmatter.coordinates.y\\n  let size = project.frontmatter.size\\n\\n  const toggle = () => {\\n    if(!$moved) {\\n      $detailsVisible = true\\n      $detailsProject = project\\n    }\\n  }\\n<\/script>\\n\\n<!-- <div\\n  class=\\"marker\\"\\n  style=\\"\\n    left: {left}px;\\n    top: {top}px;\\n    width: {diameter}px;\\n    height: {diameter}px;\\n    background-image: url('img/{marker}');\\n  \\"\\n  on:click={() => {\\n    console.log(\\"clicking\\", id);\\n    // $sidebarVisible = true;\\n    // $sidebarProject = id;\\n  }}\\n>\\n  <div\\n    class=\\"label\\"\\n    style=\\"\\n      left: {diameter + 4}px;\\n      top: {radius - 8}px;\\n    \\"\\n  >\\n    {name}\\n  </div>\\n</div>\\n\\n<style>\\n  .marker {\\n    display: block;\\n    position: relative;\\n    width: 16px;\\n    height: 16px;\\n    border-radius: 8px;\\n    position: absolute;\\n    transition: all 0.1s ease-in-out;\\n    cursor: pointer;\\n    background-size: contain;\\n    background-repeat: no-repeat;\\n    background-position: center;\\n  }\\n\\n  .label {\\n    position: absolute;\\n    width: auto;\\n    white-space: nowrap;\\n    height: 16px;\\n    background-color: black;\\n    color: white;\\n    padding: 2px;\\n    visibility: hidden;\\n  }\\n\\n  .marker:hover .label {\\n    visibility: visible;\\n  }\\n</style> -->\\n\\n<div\\n  class=\\"marker\\"\\n  style=\\"\\n    background-image: url('img/{marker}');\\n    left:{left}px;\\n    top:{top}px;\\n    width: {size.width}px;\\n    height: {size.height}px;\\n  \\"\\n  on:mouseup=\\"{toggle}\\"\\n>\\n\\n</div>\\n\\n<style>\\n  .marker {\\n    display:block;\\n    position: absolute;\\n    width: 200px;\\n    height: 200px;\\n    background-size: cover;\\n    background-repeat: no-repeat;\\n    margin-left: 500px;\\n    transform-origin: top left;\\n  }\\n\\n  .marker:hover {\\n    /* -webkit-filter: drop-shadow(4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 -4px 0 white) drop-shadow(6px 0 0 black) drop-shadow(0 6px 0 black) drop-shadow(-6px 0 0 black) drop-shadow(0 -6px 0 black); */\\n    /* filter: drop-shadow(4px 0 0 white) drop-shadow(0 4px 0 white) drop-shadow(-4px 0 0 white) drop-shadow(0 -4px 0 white) drop-shadow(6px 0 0 black) drop-shadow(0 6px 0 black) drop-shadow(-6px 0 0 black) drop-shadow(0 -6px 0 black); */\\n    filter: brightness(120%) drop-shadow(0.5px 0 0 black) drop-shadow(0 0.5px 0 black) drop-shadow(-0.5px 0 0 black) drop-shadow(0 -0.5px 0 black);\\n  \\n    /* filter: brightness(120%); */\\n    cursor: pointer;\\n  }\\n</style>"],"names":[],"mappings":"AA2FE,OAAO,eAAC,CAAC,AACP,QAAQ,KAAK,CACb,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,SAAS,CAC5B,WAAW,CAAE,KAAK,CAClB,gBAAgB,CAAE,GAAG,CAAC,IAAI,AAC5B,CAAC,AAED,sBAAO,MAAM,AAAC,CAAC,AAGb,MAAM,CAAE,WAAW,IAAI,CAAC,CAAC,YAAY,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,YAAY,CAAC,CAAC,KAAK,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,YAAY,MAAM,CAAC,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,YAAY,CAAC,CAAC,MAAM,CAAC,CAAC,CAAC,KAAK,CAAC,CAG9I,MAAM,CAAE,OAAO,AACjB,CAAC"}`
};
var Marker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_moved;
  let $$unsubscribe_detailsVisible;
  let $$unsubscribe_detailsProject;
  $$unsubscribe_moved = subscribe(moved, (value) => value);
  $$unsubscribe_detailsVisible = subscribe(detailsVisible, (value) => value);
  $$unsubscribe_detailsProject = subscribe(detailsProject, (value) => value);
  let { project } = $$props;
  let marker = project.frontmatter.marker;
  let left = project.frontmatter.coordinates.x;
  let top = project.frontmatter.coordinates.y;
  let size2 = project.frontmatter.size;
  if ($$props.project === void 0 && $$bindings.project && project !== void 0)
    $$bindings.project(project);
  $$result.css.add(css$c);
  $$unsubscribe_moved();
  $$unsubscribe_detailsVisible();
  $$unsubscribe_detailsProject();
  return `

<div class="${"marker svelte-1v95mat"}" style="${"\n    background-image: url('img/" + escape2(marker) + "');\n    left:" + escape2(left) + "px;\n    top:" + escape2(top) + "px;\n    width: " + escape2(size2.width) + "px;\n    height: " + escape2(size2.height) + "px;\n  "}"></div>`;
});
var Markers = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $meeting, $$unsubscribe_meeting;
  let $coworking, $$unsubscribe_coworking;
  let $common, $$unsubscribe_common;
  let $atelier, $$unsubscribe_atelier;
  $$unsubscribe_meeting = subscribe(meeting, (value) => $meeting = value);
  $$unsubscribe_coworking = subscribe(coworking, (value) => $coworking = value);
  $$unsubscribe_common = subscribe(common, (value) => $common = value);
  $$unsubscribe_atelier = subscribe(atelier, (value) => $atelier = value);
  let projects = getContext("projects");
  const checkLocation = (location) => {
    if (location === "meeting" && $meeting)
      return true;
    if (location === "coworking" && $coworking)
      return true;
    if (location === "common" && $common)
      return true;
    if (location === "atelier" && $atelier)
      return true;
  };
  if ($$props.checkLocation === void 0 && $$bindings.checkLocation && checkLocation !== void 0)
    $$bindings.checkLocation(checkLocation);
  $$unsubscribe_meeting();
  $$unsubscribe_coworking();
  $$unsubscribe_common();
  $$unsubscribe_atelier();
  return `${each(Object.values(projects), (project) => `${checkLocation(project.frontmatter.location) ? `${validate_component(Marker, "Marker").$$render($$result, { project }, {}, {})}` : ``}`)}`;
});
var ArrowLeft20 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let ariaLabel;
  let ariaLabelledBy;
  let labelled;
  let attributes;
  let { class: className = void 0 } = $$props;
  let { id = void 0 } = $$props;
  let { tabindex = void 0 } = $$props;
  let { focusable = false } = $$props;
  let { title = void 0 } = $$props;
  let { style = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.tabindex === void 0 && $$bindings.tabindex && tabindex !== void 0)
    $$bindings.tabindex(tabindex);
  if ($$props.focusable === void 0 && $$bindings.focusable && focusable !== void 0)
    $$bindings.focusable(focusable);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  ariaLabel = $$props["aria-label"];
  ariaLabelledBy = $$props["aria-labelledby"];
  labelled = ariaLabel || ariaLabelledBy || title;
  attributes = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-hidden": labelled ? void 0 : true,
    role: labelled ? "img" : void 0,
    focusable: tabindex === "0" ? true : focusable,
    tabindex
  };
  return `<svg${spread([
    { "data-carbon-icon": "ArrowLeft20" },
    { xmlns: "http://www.w3.org/2000/svg" },
    { viewBox: "0 0 32 32" },
    { fill: "currentColor" },
    { width: "20" },
    { height: "20" },
    { class: escape2(className) },
    { preserveAspectRatio: "xMidYMid meet" },
    { style: escape2(style) },
    { id: escape2(id) },
    attributes
  ])}><path d="${"M14 26L15.41 24.59 7.83 17 28 17 28 15 7.83 15 15.41 7.41 14 6 4 16 14 26z"}"></path>${slots.default ? slots.default({}) : `
    ${title ? `<title>${escape2(title)}</title>` : ``}
  `}</svg>`;
});
var ArrowRight20 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let ariaLabel;
  let ariaLabelledBy;
  let labelled;
  let attributes;
  let { class: className = void 0 } = $$props;
  let { id = void 0 } = $$props;
  let { tabindex = void 0 } = $$props;
  let { focusable = false } = $$props;
  let { title = void 0 } = $$props;
  let { style = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.tabindex === void 0 && $$bindings.tabindex && tabindex !== void 0)
    $$bindings.tabindex(tabindex);
  if ($$props.focusable === void 0 && $$bindings.focusable && focusable !== void 0)
    $$bindings.focusable(focusable);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  ariaLabel = $$props["aria-label"];
  ariaLabelledBy = $$props["aria-labelledby"];
  labelled = ariaLabel || ariaLabelledBy || title;
  attributes = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-hidden": labelled ? void 0 : true,
    role: labelled ? "img" : void 0,
    focusable: tabindex === "0" ? true : focusable,
    tabindex
  };
  return `<svg${spread([
    { "data-carbon-icon": "ArrowRight20" },
    { xmlns: "http://www.w3.org/2000/svg" },
    { viewBox: "0 0 20 20" },
    { fill: "currentColor" },
    { width: "20" },
    { height: "20" },
    { class: escape2(className) },
    { preserveAspectRatio: "xMidYMid meet" },
    { style: escape2(style) },
    { id: escape2(id) },
    attributes
  ])}><path d="${"M11.8 2.8L10.8 3.8 16.2 9.3 1 9.3 1 10.7 16.2 10.7 10.8 16.2 11.8 17.2 19 10z"}"></path>${slots.default ? slots.default({}) : `
    ${title ? `<title>${escape2(title)}</title>` : ``}
  `}</svg>`;
});
var ArrowUp20 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let ariaLabel;
  let ariaLabelledBy;
  let labelled;
  let attributes;
  let { class: className = void 0 } = $$props;
  let { id = void 0 } = $$props;
  let { tabindex = void 0 } = $$props;
  let { focusable = false } = $$props;
  let { title = void 0 } = $$props;
  let { style = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.tabindex === void 0 && $$bindings.tabindex && tabindex !== void 0)
    $$bindings.tabindex(tabindex);
  if ($$props.focusable === void 0 && $$bindings.focusable && focusable !== void 0)
    $$bindings.focusable(focusable);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  ariaLabel = $$props["aria-label"];
  ariaLabelledBy = $$props["aria-labelledby"];
  labelled = ariaLabel || ariaLabelledBy || title;
  attributes = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-hidden": labelled ? void 0 : true,
    role: labelled ? "img" : void 0,
    focusable: tabindex === "0" ? true : focusable,
    tabindex
  };
  return `<svg${spread([
    { "data-carbon-icon": "ArrowUp20" },
    { xmlns: "http://www.w3.org/2000/svg" },
    { viewBox: "0 0 32 32" },
    { fill: "currentColor" },
    { width: "20" },
    { height: "20" },
    { class: escape2(className) },
    { preserveAspectRatio: "xMidYMid meet" },
    { style: escape2(style) },
    { id: escape2(id) },
    attributes
  ])}><path d="${"M16 4L6 14 7.41 15.41 15 7.83 15 28 17 28 17 7.83 24.59 15.41 26 14 16 4z"}"></path>${slots.default ? slots.default({}) : `
    ${title ? `<title>${escape2(title)}</title>` : ``}
  `}</svg>`;
});
var ArrowDown20 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let ariaLabel;
  let ariaLabelledBy;
  let labelled;
  let attributes;
  let { class: className = void 0 } = $$props;
  let { id = void 0 } = $$props;
  let { tabindex = void 0 } = $$props;
  let { focusable = false } = $$props;
  let { title = void 0 } = $$props;
  let { style = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.tabindex === void 0 && $$bindings.tabindex && tabindex !== void 0)
    $$bindings.tabindex(tabindex);
  if ($$props.focusable === void 0 && $$bindings.focusable && focusable !== void 0)
    $$bindings.focusable(focusable);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  ariaLabel = $$props["aria-label"];
  ariaLabelledBy = $$props["aria-labelledby"];
  labelled = ariaLabel || ariaLabelledBy || title;
  attributes = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-hidden": labelled ? void 0 : true,
    role: labelled ? "img" : void 0,
    focusable: tabindex === "0" ? true : focusable,
    tabindex
  };
  return `<svg${spread([
    { "data-carbon-icon": "ArrowDown20" },
    { xmlns: "http://www.w3.org/2000/svg" },
    { viewBox: "0 0 32 32" },
    { fill: "currentColor" },
    { width: "20" },
    { height: "20" },
    { class: escape2(className) },
    { preserveAspectRatio: "xMidYMid meet" },
    { style: escape2(style) },
    { id: escape2(id) },
    attributes
  ])}><path d="${"M24.59 16.59L17 24.17 17 4 15 4 15 24.17 7.41 16.59 6 18 16 28 26 18 24.59 16.59z"}"></path>${slots.default ? slots.default({}) : `
    ${title ? `<title>${escape2(title)}</title>` : ``}
  `}</svg>`;
});
var Add20 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let ariaLabel;
  let ariaLabelledBy;
  let labelled;
  let attributes;
  let { class: className = void 0 } = $$props;
  let { id = void 0 } = $$props;
  let { tabindex = void 0 } = $$props;
  let { focusable = false } = $$props;
  let { title = void 0 } = $$props;
  let { style = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.tabindex === void 0 && $$bindings.tabindex && tabindex !== void 0)
    $$bindings.tabindex(tabindex);
  if ($$props.focusable === void 0 && $$bindings.focusable && focusable !== void 0)
    $$bindings.focusable(focusable);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  ariaLabel = $$props["aria-label"];
  ariaLabelledBy = $$props["aria-labelledby"];
  labelled = ariaLabel || ariaLabelledBy || title;
  attributes = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-hidden": labelled ? void 0 : true,
    role: labelled ? "img" : void 0,
    focusable: tabindex === "0" ? true : focusable,
    tabindex
  };
  return `<svg${spread([
    { "data-carbon-icon": "Add20" },
    { xmlns: "http://www.w3.org/2000/svg" },
    { viewBox: "0 0 32 32" },
    { fill: "currentColor" },
    { width: "20" },
    { height: "20" },
    { class: escape2(className) },
    { preserveAspectRatio: "xMidYMid meet" },
    { style: escape2(style) },
    { id: escape2(id) },
    attributes
  ])}><path d="${"M17 15L17 8 15 8 15 15 8 15 8 17 15 17 15 24 17 24 17 17 24 17 24 15z"}"></path>${slots.default ? slots.default({}) : `
    ${title ? `<title>${escape2(title)}</title>` : ``}
  `}</svg>`;
});
var Subtract20 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let ariaLabel;
  let ariaLabelledBy;
  let labelled;
  let attributes;
  let { class: className = void 0 } = $$props;
  let { id = void 0 } = $$props;
  let { tabindex = void 0 } = $$props;
  let { focusable = false } = $$props;
  let { title = void 0 } = $$props;
  let { style = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.tabindex === void 0 && $$bindings.tabindex && tabindex !== void 0)
    $$bindings.tabindex(tabindex);
  if ($$props.focusable === void 0 && $$bindings.focusable && focusable !== void 0)
    $$bindings.focusable(focusable);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  ariaLabel = $$props["aria-label"];
  ariaLabelledBy = $$props["aria-labelledby"];
  labelled = ariaLabel || ariaLabelledBy || title;
  attributes = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-hidden": labelled ? void 0 : true,
    role: labelled ? "img" : void 0,
    focusable: tabindex === "0" ? true : focusable,
    tabindex
  };
  return `<svg${spread([
    { "data-carbon-icon": "Subtract20" },
    { xmlns: "http://www.w3.org/2000/svg" },
    { viewBox: "0 0 32 32" },
    { fill: "currentColor" },
    { width: "20" },
    { height: "20" },
    { class: escape2(className) },
    { preserveAspectRatio: "xMidYMid meet" },
    { style: escape2(style) },
    { id: escape2(id) },
    attributes
  ])}><path d="${"M8 15H24V17H8z"}"></path>${slots.default ? slots.default({}) : `
    ${title ? `<title>${escape2(title)}</title>` : ``}
  `}</svg>`;
});
var Reset20 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let ariaLabel;
  let ariaLabelledBy;
  let labelled;
  let attributes;
  let { class: className = void 0 } = $$props;
  let { id = void 0 } = $$props;
  let { tabindex = void 0 } = $$props;
  let { focusable = false } = $$props;
  let { title = void 0 } = $$props;
  let { style = void 0 } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.tabindex === void 0 && $$bindings.tabindex && tabindex !== void 0)
    $$bindings.tabindex(tabindex);
  if ($$props.focusable === void 0 && $$bindings.focusable && focusable !== void 0)
    $$bindings.focusable(focusable);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  ariaLabel = $$props["aria-label"];
  ariaLabelledBy = $$props["aria-labelledby"];
  labelled = ariaLabel || ariaLabelledBy || title;
  attributes = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-hidden": labelled ? void 0 : true,
    role: labelled ? "img" : void 0,
    focusable: tabindex === "0" ? true : focusable,
    tabindex
  };
  return `<svg${spread([
    { "data-carbon-icon": "Reset20" },
    { xmlns: "http://www.w3.org/2000/svg" },
    { viewBox: "0 0 32 32" },
    { fill: "currentColor" },
    { width: "20" },
    { height: "20" },
    { class: escape2(className) },
    { preserveAspectRatio: "xMidYMid meet" },
    { style: escape2(style) },
    { id: escape2(id) },
    attributes
  ])}><path d="${"M18,28A12,12,0,1,0,6,16v6.2L2.4,18.6,1,20l6,6,6-6-1.4-1.4L8,22.2V16H8A10,10,0,1,1,18,26Z"}"></path>${slots.default ? slots.default({}) : `
    ${title ? `<title>${escape2(title)}</title>` : ``}
  `}</svg>`;
});
var css$b = {
  code: "button.svelte-1f8qdub{position:absolute;color:black;background-color:white;border:2px solid black;padding:2px 4px}button.svelte-1f8qdub:hover{background-color:var(--grey);cursor:pointer}button.svelte-1f8qdub:active{color:white;background-color:black}.left.svelte-1f8qdub{left:10px;top:calc(100% / 2 - 15px)}.right.svelte-1f8qdub{right:10px;top:calc(100% / 2 - 15px)}.up.svelte-1f8qdub{left:calc(100% / 2 - 15px);top:10px}.down.svelte-1f8qdub{left:calc(100% / 2 - 15px);bottom:10px}.reset.svelte-1f8qdub{right:10px;bottom:10px}.zoomin.svelte-1f8qdub{bottom:90px;right:10px}.zoomout.svelte-1f8qdub{bottom:50px;right:10px}",
  map: '{"version":3,"file":"UI.svelte","sources":["UI.svelte"],"sourcesContent":["<script>\\n  import { pos, scale } from \\"$lib/stores/map\\";\\n\\n  import ArrowLeft20 from \\"carbon-icons-svelte/lib/ArrowLeft20\\";\\n  import ArrowRight20 from \\"carbon-icons-svelte/lib/ArrowRight20\\";\\n  import ArrowUp20 from \\"carbon-icons-svelte/lib/ArrowUp20\\";\\n  import ArrowDown20 from \\"carbon-icons-svelte/lib/ArrowDown20\\";\\n\\n  import Add20 from \\"carbon-icons-svelte/lib/Add20\\";\\n  import Subtract20 from \\"carbon-icons-svelte/lib/Subtract20\\";\\n  import Reset20 from \\"carbon-icons-svelte/lib/Reset20\\";\\n\\n<\/script>\\n\\n<button class=\\"left\\" on:click={() => pos.moveLeft(250)}>\\n  <ArrowLeft20 title=\\"left\\" />\\n</button>\\n\\n<button class=\\"right\\" on:click={() => pos.moveRight(250)}>\\n  <ArrowRight20 title=\\"right\\" />\\n</button>\\n\\n<button class=\\"up\\" on:click={() => pos.moveUp(250)}>\\n  <ArrowUp20 title=\\"up\\" />\\n</button>\\n\\n<button class=\\"down\\" on:click={() => pos.moveDown(250)}>\\n  <ArrowDown20 title=\\"down\\" />\\n</button>\\n\\n<button class=\\"zoomin\\" on:click={scale.zoomIn}>\\n  <Add20 title=\\"zoom in\\" />\\n</button>\\n\\n<button class=\\"zoomout\\" on:click={scale.zoomOut}>\\n  <Subtract20 title=\\"zoom out\\" />\\n</button>\\n\\n<button\\n  class=\\"reset\\"\\n  on:click={() => {\\n    pos.reset();\\n    scale.reset();\\n  }}\\n>\\n  <Reset20 title=\\"reset map\\" />\\n</button>\\n\\n<style>\\n  button {\\n    position: absolute;\\n    color: black;\\n    background-color: white;\\n    border: 2px solid black;\\n    padding: 2px 4px;\\n  }\\n\\n  button:hover {\\n    background-color: var(--grey);\\n    cursor: pointer;\\n  }\\n\\n  button:active {\\n    color: white;\\n    background-color: black;\\n  }\\n\\n  .left {\\n    left: 10px;\\n    top: calc(100% / 2 - 15px);\\n  }\\n\\n  .right {\\n    right: 10px;\\n    top: calc(100% / 2 - 15px);\\n  }\\n\\n  .up {\\n    left: calc(100% / 2 - 15px);\\n    top: 10px;\\n  }\\n\\n  .down {\\n    left: calc(100% / 2 - 15px);\\n    bottom: 10px;\\n  }\\n\\n  .reset {\\n    right: 10px;\\n    bottom: 10px;\\n  }\\n\\n  .zoomin {\\n    bottom: 90px;\\n    right: 10px;\\n  }\\n\\n  .zoomout {\\n    bottom: 50px;\\n    right: 10px;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAiDE,MAAM,eAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,KAAK,CACZ,gBAAgB,CAAE,KAAK,CACvB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,CACvB,OAAO,CAAE,GAAG,CAAC,GAAG,AAClB,CAAC,AAED,qBAAM,MAAM,AAAC,CAAC,AACZ,gBAAgB,CAAE,IAAI,MAAM,CAAC,CAC7B,MAAM,CAAE,OAAO,AACjB,CAAC,AAED,qBAAM,OAAO,AAAC,CAAC,AACb,KAAK,CAAE,KAAK,CACZ,gBAAgB,CAAE,KAAK,AACzB,CAAC,AAED,KAAK,eAAC,CAAC,AACL,IAAI,CAAE,IAAI,CACV,GAAG,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,AAC5B,CAAC,AAED,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,IAAI,CACX,GAAG,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,AAC5B,CAAC,AAED,GAAG,eAAC,CAAC,AACH,IAAI,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAC3B,GAAG,CAAE,IAAI,AACX,CAAC,AAED,KAAK,eAAC,CAAC,AACL,IAAI,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAC3B,MAAM,CAAE,IAAI,AACd,CAAC,AAED,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AACd,CAAC,AAED,OAAO,eAAC,CAAC,AACP,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,AACb,CAAC,AAED,QAAQ,eAAC,CAAC,AACR,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,AACb,CAAC"}'
};
var UI = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$b);
  return `<button class="${"left svelte-1f8qdub"}">${validate_component(ArrowLeft20, "ArrowLeft20").$$render($$result, { title: "left" }, {}, {})}</button>

<button class="${"right svelte-1f8qdub"}">${validate_component(ArrowRight20, "ArrowRight20").$$render($$result, { title: "right" }, {}, {})}</button>

<button class="${"up svelte-1f8qdub"}">${validate_component(ArrowUp20, "ArrowUp20").$$render($$result, { title: "up" }, {}, {})}</button>

<button class="${"down svelte-1f8qdub"}">${validate_component(ArrowDown20, "ArrowDown20").$$render($$result, { title: "down" }, {}, {})}</button>

<button class="${"zoomin svelte-1f8qdub"}">${validate_component(Add20, "Add20").$$render($$result, { title: "zoom in" }, {}, {})}</button>

<button class="${"zoomout svelte-1f8qdub"}">${validate_component(Subtract20, "Subtract20").$$render($$result, { title: "zoom out" }, {}, {})}</button>

<button class="${"reset svelte-1f8qdub"}">${validate_component(Reset20, "Reset20").$$render($$result, { title: "reset map" }, {}, {})}
</button>`;
});
var getLocation = (location) => {
  if (location === "meeting")
    return "Meeting Space";
  if (location === "coworking")
    return "Co-working Space";
  if (location === "common")
    return "Common Space";
  if (location === "atelier")
    return "Atelier";
  return "other";
};
var css$a = {
  code: "header.svelte-1ksgqz7{background-color:var(--black);color:white;padding:.25rem .5rem;display:flex;flex-direction:row;justify-content:space-between}button.svelte-1ksgqz7{appearance:none;-webkit-appearance:none;color:inherit;background-color:inherit;font-size:inherit;vertical-align:inherit;border:none;padding:0;margin:0;outline:0;cursor:pointer;letter-spacing:1px}button.svelte-1ksgqz7:hover{text-shadow:1px 0 0 white}",
  map: `{"version":3,"file":"Topbar.svelte","sources":["Topbar.svelte"],"sourcesContent":["<script>\\n  import { createEventDispatcher } from 'svelte';\\n\\n  export let text\\n  export let action = \\"\\";\\n\\n  const dispatch = createEventDispatcher();\\n<\/script>\\n\\n<header>\\n  <div>\\n    { text }\\n  </div>\\n  <button on:click=\\"{() => dispatch('action', 'action')}\\">\\n    { action }\\n  </button>\\n</header>\\n\\n<style>\\n  header {\\n    background-color: var(--black);\\n    color: white;\\n    padding: .25rem .5rem;\\n    display: flex;\\n    flex-direction: row;\\n    justify-content: space-between;\\n  }\\n\\n  button {\\n    appearance: none;\\n    -webkit-appearance: none;\\n\\n    color: inherit;\\n    background-color: inherit;\\n    font-size: inherit;\\n    vertical-align: inherit;\\n    border: none;\\n    padding: 0;\\n    margin: 0;\\n    outline: 0;\\n\\n    cursor: pointer;\\n    letter-spacing: 1px;\\n  }\\n\\n  button:hover {\\n    text-shadow: 1px 0 0 white;\\n  }\\n</style>"],"names":[],"mappings":"AAmBE,MAAM,eAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,OAAO,CAAC,CAC9B,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,MAAM,CAAC,KAAK,CACrB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,CACnB,eAAe,CAAE,aAAa,AAChC,CAAC,AAED,MAAM,eAAC,CAAC,AACN,UAAU,CAAE,IAAI,CAChB,kBAAkB,CAAE,IAAI,CAExB,KAAK,CAAE,OAAO,CACd,gBAAgB,CAAE,OAAO,CACzB,SAAS,CAAE,OAAO,CAClB,cAAc,CAAE,OAAO,CACvB,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,CAAC,CAEV,MAAM,CAAE,OAAO,CACf,cAAc,CAAE,GAAG,AACrB,CAAC,AAED,qBAAM,MAAM,AAAC,CAAC,AACZ,WAAW,CAAE,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,KAAK,AAC5B,CAAC"}`
};
var Topbar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { text } = $$props;
  let { action = "" } = $$props;
  createEventDispatcher();
  if ($$props.text === void 0 && $$bindings.text && text !== void 0)
    $$bindings.text(text);
  if ($$props.action === void 0 && $$bindings.action && action !== void 0)
    $$bindings.action(action);
  $$result.css.add(css$a);
  return `<header class="${"svelte-1ksgqz7"}"><div>${escape2(text)}</div>
  <button class="${"svelte-1ksgqz7"}">${escape2(action)}</button>
</header>`;
});
var css$9 = {
  code: ".carousel.svelte-1lrss8x{position:relative;width:calc(100% - 2rem);height:auto;border:var(--border);margin:0 auto;display:flex;flex-direction:row;overflow-x:auto}.collapsed.svelte-1lrss8x{width:17.5rem;height:16.5rem;overflow:hidden}.buttons.svelte-1lrss8x{position:absolute;bottom:.5rem;right:.5rem}.buttons.collapsed.svelte-1lrss8x{display:none}button.svelte-1lrss8x{width:1rem;height:1rem;margin-right:.5rem;background:white;border:2px solid black;border-radius:.5rem}button.svelte-1lrss8x:hover{background:black}button.active.svelte-1lrss8x{background:black}img.svelte-1lrss8x{width:100%;height:auto}",
  map: `{"version":3,"file":"Carousel.svelte","sources":["Carousel.svelte"],"sourcesContent":["<script>\\n  export let images\\n  export let collapsed\\n\\n  export let img = 0\\n\\n  console.log(images)\\n<\/script>\\n\\n<div class=\\"carousel\\" class:collapsed >\\n  <img src=\\"/img/{ images[img] }\\" alt=\\"{images[img]}\\" />\\n  <div class=\\"buttons\\" class:collapsed>\\n    {#each images as image, index}\\n      <button on:click={() => {img = index}} class=\\"{ img==index ? 'active' : '' }\\" />\\n    {/each}\\n  </div>\\n</div>\\n\\n<style>\\n  .carousel {\\n    position: relative;\\n    width: calc(100% - 2rem);\\n    height: auto;\\n\\n    border: var(--border);\\n    margin: 0 auto;   \\n    \\n    display: flex;\\n    flex-direction: row;\\n    overflow-x: auto;\\n  }\\n\\n  .collapsed {\\n    width: 17.5rem;\\n    height: 16.5rem;\\n    overflow: hidden;\\n  }\\n\\n  .buttons {\\n    position: absolute;\\n    bottom: .5rem;\\n    right: .5rem;\\n  }\\n\\n  .buttons.collapsed {\\n    display: none;\\n  }\\n\\n  button {\\n    width: 1rem;\\n    height: 1rem;\\n    margin-right: .5rem;\\n    background: white;\\n    border: 2px solid black;\\n    border-radius: .5rem;\\n  }\\n\\n  button:hover {\\n    background: black;\\n  }\\n\\n  button.active {\\n    background: black;\\n  }\\n\\n  img {\\n    width: 100%;\\n    height: auto;\\n  }\\n</style>"],"names":[],"mappings":"AAmBE,SAAS,eAAC,CAAC,AACT,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CACxB,MAAM,CAAE,IAAI,CAEZ,MAAM,CAAE,IAAI,QAAQ,CAAC,CACrB,MAAM,CAAE,CAAC,CAAC,IAAI,CAEd,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,CACnB,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,UAAU,eAAC,CAAC,AACV,KAAK,CAAE,OAAO,CACd,MAAM,CAAE,OAAO,CACf,QAAQ,CAAE,MAAM,AAClB,CAAC,AAED,QAAQ,eAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,KAAK,AACd,CAAC,AAED,QAAQ,UAAU,eAAC,CAAC,AAClB,OAAO,CAAE,IAAI,AACf,CAAC,AAED,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,YAAY,CAAE,KAAK,CACnB,UAAU,CAAE,KAAK,CACjB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,CACvB,aAAa,CAAE,KAAK,AACtB,CAAC,AAED,qBAAM,MAAM,AAAC,CAAC,AACZ,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,MAAM,OAAO,eAAC,CAAC,AACb,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,GAAG,eAAC,CAAC,AACH,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AACd,CAAC"}`
};
var Carousel = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { images } = $$props;
  let { collapsed } = $$props;
  let { img = 0 } = $$props;
  console.log(images);
  if ($$props.images === void 0 && $$bindings.images && images !== void 0)
    $$bindings.images(images);
  if ($$props.collapsed === void 0 && $$bindings.collapsed && collapsed !== void 0)
    $$bindings.collapsed(collapsed);
  if ($$props.img === void 0 && $$bindings.img && img !== void 0)
    $$bindings.img(img);
  $$result.css.add(css$9);
  return `<div class="${["carousel svelte-1lrss8x", collapsed ? "collapsed" : ""].join(" ").trim()}"><img src="${"/img/" + escape2(images[img])}"${add_attribute("alt", images[img], 0)} class="${"svelte-1lrss8x"}">
  <div class="${["buttons svelte-1lrss8x", collapsed ? "collapsed" : ""].join(" ").trim()}">${each(images, (image, index2) => `<button class="${escape2(null_to_empty(img == index2 ? "active" : "")) + " svelte-1lrss8x"}"></button>`)}</div>
</div>`;
});
var css$8 = {
  code: '.container.svelte-8zzg24.svelte-8zzg24{flex-grow:1;display:flex;flex-direction:column;min-height:0}.expandable.svelte-8zzg24.svelte-8zzg24{border:var(--border)}.expandable.svelte-8zzg24.svelte-8zzg24:hover{outline:var(--border)\n  }.expanded.svelte-8zzg24.svelte-8zzg24{outline:var(--border);grid-row-end:span 4;grid-column-end:span 2;transition:all ease-in-out 1s}.project.svelte-8zzg24.svelte-8zzg24{display:flex;flex-direction:column;min-height:0;flex-grow:1;max-height:100%;background-color:white}main.svelte-8zzg24.svelte-8zzg24{flex-grow:1;display:flex;flex-direction:column;padding:1rem}.expanded.svelte-8zzg24 main.svelte-8zzg24{overflow-y:auto}.content.svelte-8zzg24.svelte-8zzg24{margin-bottom:2rem}h4.svelte-8zzg24.svelte-8zzg24{text-transform:uppercase;font-size:1.5rem;margin:2rem 0 1.5rem 0}h4.instructions.svelte-8zzg24.svelte-8zzg24{margin-top:2.5rem;margin-bottom:0}h4.author.svelte-8zzg24.svelte-8zzg24{margin-top:0;margin-bottom:0rem}h3.svelte-8zzg24.svelte-8zzg24{font-size:4rem;margin-left:1rem;text-transform:lowercase;font-weight:normal;line-height:3rem;letter-spacing:-1.4px}h3.location.svelte-8zzg24.svelte-8zzg24{margin-bottom:1rem}h3.svelte-8zzg24.svelte-8zzg24::after{margin-left:.5rem;font-size:1rem;height:1rem;line-height:1rem;letter-spacing:-0.2px;-webkit-text-stroke:0;-webkit-text-stroke-width:0;-webkit-text-fill-color:currentColor}h3.location.svelte-8zzg24.svelte-8zzg24::after{content:"/ location"\n  }h3.action.svelte-8zzg24.svelte-8zzg24::after{content:"/ action"\n  }p.svelte-8zzg24.svelte-8zzg24{margin-top:.5rem;margin-bottom:-.5rem}',
  map: `{"version":3,"file":"Project.svelte","sources":["Project.svelte"],"sourcesContent":["<script>\\n  import { createEventDispatcher } from 'svelte';\\n  import marked from 'marked';\\n  import { getLocation } from '$lib/util/location'\\n  \\n  import Topbar from '$lib/elements/Topbar.svelte'\\n  import Carousel from '$lib/elements/Carousel.svelte'\\n  \\n  export let project\\n  \\n  export let closable = false;\\n  export let expandable = false;\\n  \\n  let collapsed = expandable ? true : false;\\n  export let expanded = !collapsed;\\n  \\n  const dispatch = createEventDispatcher();\\n\\n  const { name, action, images, author } = project.frontmatter\\n  const location = getLocation(project.frontmatter.location)\\n  const id = (\\"000\\" + project.frontmatter.id).slice(-3)\\n  const content = marked( project.content )\\n\\n  const close = () => {\\n    dispatch('close')\\n  }\\n\\n  const expand = () => {\\n    collapsed = false;\\n    expanded = true\\n    dispatch('expand')\\n  }\\n\\n  const collapse = () => {\\n    collapsed = true;\\n    expanded = false\\n    dispatch('collapse')\\n  }\\n\\n  const handleAction = () => {\\n    console.log(\\"handling action\\")\\n    if (closable) {\\n      console.log(\\"closing\\")\\n      close()\\n    } else if (expandable) {\\n      if (collapsed) {\\n        console.log(\\"expanding\\")\\n        expand()\\n      } else {\\n        console.log(\\"collapsing\\")\\n        collapse()\\n      }\\n    }\\n  }\\n\\n<\/script>\\n\\n<div \\n  class=\\"project\\"\\n  class:expandable\\n  class:expanded\\n>\\n  <div class=\\"container\\" >\\n  {#if !collapsed}\\n    <Topbar \\n      text = { \`\${id}. \${name} / \${action}\` }\\n      action = { collapsed ? \\"\\" : \\"/ X\\"}\\n      on:action = { handleAction }\\n    />\\n  {/if}\\n  <main\\n    on:click = { collapsed ? expand : \\"\\" }\\n  >\\n  <Carousel { images } { collapsed } />\\n\\n  {#if collapsed}\\n    <p>Instructions by { author }</p>\\n  {:else}\\n    <h4>{ name }</h4>\\n    <h3 class=\\"location\\">{ location }</h3>\\n    <h3 class=\\"action outline\\">{ action }</h3>\\n    <h4 class=\\"instructions\\">Instructions by</h4>\\n    <h4 class=\\"author\\">{ author }</h4>\\n    <div class=\\"content\\">{@html content }</div>\\n  {/if}\\n</main>\\n</div>\\n</div>\\n\\n<style>\\n  .container {\\n    flex-grow: 1;\\n    display: flex;\\n    flex-direction: column;\\n    min-height: 0;\\n  }\\n\\n  .expandable {\\n    border: var(--border);\\n  }\\n\\n  .expandable:hover {\\n    outline: var(--border)\\n  }\\n\\n  .expanded {\\n    outline: var(--border);\\n    grid-row-end: span 4;\\n    grid-column-end: span 2;\\n    transition: all ease-in-out 1s;\\n  }\\n\\n  .project {\\n    display: flex;\\n    flex-direction: column;\\n    min-height: 0;\\n    flex-grow: 1;\\n    max-height: 100%;\\n    background-color:white;\\n  }\\n\\n  main {\\n    flex-grow: 1;\\n    display: flex;\\n    flex-direction: column;\\n    padding: 1rem;\\n  }\\n\\n  .expanded main {\\n    overflow-y: auto;\\n  }\\n\\n  .content {\\n    margin-bottom: 2rem;\\n  }\\n\\n  h4 {\\n    text-transform: uppercase;\\n    font-size: 1.5rem;\\n    margin: 2rem 0 1.5rem 0;\\n  }\\n\\n  h4.instructions {\\n    margin-top: 2.5rem;\\n    margin-bottom: 0;\\n  }\\n\\n  h4.author {\\n    margin-top: 0;\\n    margin-bottom: 0rem;\\n  }\\n\\n  h3 {\\n    font-size: 4rem;\\n    margin-left: 1rem;\\n    text-transform: lowercase;\\n    font-weight: normal;\\n    line-height: 3rem;\\n    letter-spacing: -1.4px;\\n  }\\n\\n  h3.location {\\n    margin-bottom: 1rem;\\n  }\\n\\n  h3::after {\\n    margin-left: .5rem; \\n    font-size: 1rem;\\n    height: 1rem;\\n    line-height: 1rem;\\n    letter-spacing: -0.2px;\\n    -webkit-text-stroke: 0;\\n    -webkit-text-stroke-width: 0;\\n    -webkit-text-fill-color: currentColor;\\n  }\\n\\n  h3.location::after {\\n    content: \\"/ location\\"\\n  } \\n\\n  h3.action::after {\\n    content: \\"/ action\\"\\n  }\\n\\n  p {\\n    margin-top: .5rem;\\n    margin-bottom: -.5rem;\\n  }\\n</style>"],"names":[],"mappings":"AA0FE,UAAU,4BAAC,CAAC,AACV,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,CAAC,AACf,CAAC,AAED,WAAW,4BAAC,CAAC,AACX,MAAM,CAAE,IAAI,QAAQ,CAAC,AACvB,CAAC,AAED,uCAAW,MAAM,AAAC,CAAC,AACjB,OAAO,CAAE,IAAI,QAAQ,CAAC;EACxB,CAAC,AAED,SAAS,4BAAC,CAAC,AACT,OAAO,CAAE,IAAI,QAAQ,CAAC,CACtB,YAAY,CAAE,IAAI,CAAC,CAAC,CACpB,eAAe,CAAE,IAAI,CAAC,CAAC,CACvB,UAAU,CAAE,GAAG,CAAC,WAAW,CAAC,EAAE,AAChC,CAAC,AAED,QAAQ,4BAAC,CAAC,AACR,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,CAAC,CACb,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,IAAI,CAChB,iBAAiB,KAAK,AACxB,CAAC,AAED,IAAI,4BAAC,CAAC,AACJ,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,OAAO,CAAE,IAAI,AACf,CAAC,AAED,uBAAS,CAAC,IAAI,cAAC,CAAC,AACd,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,QAAQ,4BAAC,CAAC,AACR,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,EAAE,4BAAC,CAAC,AACF,cAAc,CAAE,SAAS,CACzB,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,IAAI,CAAC,CAAC,CAAC,MAAM,CAAC,CAAC,AACzB,CAAC,AAED,EAAE,aAAa,4BAAC,CAAC,AACf,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,CAAC,AAClB,CAAC,AAED,EAAE,OAAO,4BAAC,CAAC,AACT,UAAU,CAAE,CAAC,CACb,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,EAAE,4BAAC,CAAC,AACF,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,CACjB,cAAc,CAAE,SAAS,CACzB,WAAW,CAAE,MAAM,CACnB,WAAW,CAAE,IAAI,CACjB,cAAc,CAAE,MAAM,AACxB,CAAC,AAED,EAAE,SAAS,4BAAC,CAAC,AACX,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,8BAAE,OAAO,AAAC,CAAC,AACT,WAAW,CAAE,KAAK,CAClB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,IAAI,CACZ,WAAW,CAAE,IAAI,CACjB,cAAc,CAAE,MAAM,CACtB,mBAAmB,CAAE,CAAC,CACtB,yBAAyB,CAAE,CAAC,CAC5B,uBAAuB,CAAE,YAAY,AACvC,CAAC,AAED,EAAE,qCAAS,OAAO,AAAC,CAAC,AAClB,OAAO,CAAE,YAAY;EACvB,CAAC,AAED,EAAE,mCAAO,OAAO,AAAC,CAAC,AAChB,OAAO,CAAE,UAAU;EACrB,CAAC,AAED,CAAC,4BAAC,CAAC,AACD,UAAU,CAAE,KAAK,CACjB,aAAa,CAAE,MAAM,AACvB,CAAC"}`
};
var Project = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { project } = $$props;
  let { closable = false } = $$props;
  let { expandable = false } = $$props;
  let collapsed = expandable ? true : false;
  let { expanded = !collapsed } = $$props;
  createEventDispatcher();
  const { name, action, images, author } = project.frontmatter;
  const location = getLocation(project.frontmatter.location);
  const id = ("000" + project.frontmatter.id).slice(-3);
  const content = (0, import_marked.default)(project.content);
  if ($$props.project === void 0 && $$bindings.project && project !== void 0)
    $$bindings.project(project);
  if ($$props.closable === void 0 && $$bindings.closable && closable !== void 0)
    $$bindings.closable(closable);
  if ($$props.expandable === void 0 && $$bindings.expandable && expandable !== void 0)
    $$bindings.expandable(expandable);
  if ($$props.expanded === void 0 && $$bindings.expanded && expanded !== void 0)
    $$bindings.expanded(expanded);
  $$result.css.add(css$8);
  return `<div class="${[
    "project svelte-8zzg24",
    (expandable ? "expandable" : "") + " " + (expanded ? "expanded" : "")
  ].join(" ").trim()}"><div class="${"container svelte-8zzg24"}">${!collapsed ? `${validate_component(Topbar, "Topbar").$$render($$result, {
    text: `${id}. ${name} / ${action}`,
    action: collapsed ? "" : "/ X"
  }, {}, {})}` : ``}
  <main class="${"svelte-8zzg24"}">${validate_component(Carousel, "Carousel").$$render($$result, { images, collapsed }, {}, {})}

  ${collapsed ? `<p class="${"svelte-8zzg24"}">Instructions by ${escape2(author)}</p>` : `<h4 class="${"svelte-8zzg24"}">${escape2(name)}</h4>
    <h3 class="${"location svelte-8zzg24"}">${escape2(location)}</h3>
    <h3 class="${"action outline svelte-8zzg24"}">${escape2(action)}</h3>
    <h4 class="${"instructions svelte-8zzg24"}">Instructions by</h4>
    <h4 class="${"author svelte-8zzg24"}">${escape2(author)}</h4>
    <div class="${"content svelte-8zzg24"}">${content}</div>`}</main></div>
</div>`;
});
var css$7 = {
  code: "aside.svelte-1kjacbs{position:absolute;z-index:100;left:0;top:0;height:100%;display:flex;flex-direction:column;width:400px;border-right:var(--border)}",
  map: '{"version":3,"file":"Details.svelte","sources":["Details.svelte"],"sourcesContent":["<script>\\n  import { getContext } from \\"svelte\\";\\n  import { detailsVisible, detailsProject } from \\"$lib/stores/map\\"\\n\\n  // import Topbar from \\"$lib/elements/Topbar.svelte\\"\\n  import Project from \\"$lib/elements/Project.svelte\\"\\n\\n  // export let projects = getContext(\\"projects\\")\\n  let project = $detailsProject\\n\\n  const toggle = () => {\\n    $detailsVisible = false\\n  }\\n<\/script>\\n\\n{#if $detailsVisible}\\n<aside>\\n  <Project closable { project } on:close={toggle} />\\n</aside>\\n{/if}\\n\\n<style>\\n  aside {\\n    position: absolute;\\n    z-index: 100;\\n\\n    /* windowed layout */\\n    /* left: 1rem;\\n    top: 1rem;\\n    height: calc(100% - 2rem); */\\n\\n    /* sidebar layout */\\n    left: 0;\\n    top: 0;\\n    height: 100%;\\n\\n    display: flex;\\n    flex-direction: column;\\n    width: 400px;\\n    border-right: var(--border);\\n  }\\n</style>"],"names":[],"mappings":"AAsBE,KAAK,eAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,GAAG,CAQZ,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,MAAM,CAAE,IAAI,CAEZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,KAAK,CAAE,KAAK,CACZ,YAAY,CAAE,IAAI,QAAQ,CAAC,AAC7B,CAAC"}'
};
var Details = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $detailsProject, $$unsubscribe_detailsProject;
  let $detailsVisible, $$unsubscribe_detailsVisible;
  $$unsubscribe_detailsProject = subscribe(detailsProject, (value) => $detailsProject = value);
  $$unsubscribe_detailsVisible = subscribe(detailsVisible, (value) => $detailsVisible = value);
  let project = $detailsProject;
  $$result.css.add(css$7);
  $$unsubscribe_detailsProject();
  $$unsubscribe_detailsVisible();
  return `${$detailsVisible ? `<aside class="${"svelte-1kjacbs"}">${validate_component(Project, "Project").$$render($$result, { closable: true, project }, {}, {})}</aside>` : ``}`;
});
var css$6 = {
  code: ".map.svelte-2pognb{transform-origin:top left;position:absolute;transition:all 0.1s ease-in-out;cursor:grab}picture.svelte-2pognb{position:absolute;top:0;left:0;right:0;bottom:0}.viewport.svelte-2pognb{position:relative;overflow:hidden;display:flex;flex-grow:1;margin:0;padding:0}.dragging.svelte-2pognb{transition:none}",
  map: `{"version":3,"file":"Map.svelte","sources":["Map.svelte"],"sourcesContent":["<script>\\n  import { size, pos, dragging, scale, detailsVisible, viewport } from \\"$lib/stores/map\\";\\n  \\n  import Markers from \\"./Markers.svelte\\"\\n  import UI from \\"./UI.svelte\\"\\n  import Details from \\"./Details.svelte\\"\\n  \\n  import { startDrag } from \\"$lib/util/draggable\\";\\n\\n  $: w = $size.width;\\n  $: h = $size.height;\\n\\n  $: x = $pos.x;\\n  $: y = $pos.y;\\n<\/script>\\n\\n<div\\n  class=\\"viewport\\"\\n  bind:clientWidth={$viewport.width}\\n  bind:clientHeight={$viewport.height}\\n  >\\n  {#if $detailsVisible }\\n    <Details />\\n  {/if}\\n  <div \\n    class=\\"map {$dragging ? 'dragging' : ''}\\"\\n    style=\\"\\n      width: {w}px;\\n      height: {h}px;\\n      translate: -{x}px -{y}px;\\n      scale: {$scale};\\n    \\"\\n    on:mousedown={ (e) => startDrag(e) }\\n  >\\n    <picture>\\n      <source type=\\"image/webp\\" srcset=\\"/img/bg.webp\\">\\n      <source type=\\"image/jpg\\" srcset=\\"/img/bg.jpg\\">\\n      <img src=\\"/img/bg.jpg\\" alt=\\"map\\">\\n    </picture>\\n    <Markers />\\n  </div>\\n  <UI />\\n</div>\\n\\n<style>\\n  .map {\\n    transform-origin: top left;\\n    position: absolute;\\n    transition: all 0.1s ease-in-out;\\n    cursor: grab;\\n  }\\n\\n  picture {\\n    position: absolute;\\n    top: 0;\\n    left: 0;\\n    right: 0;\\n    bottom: 0;\\n  }\\n\\n  .viewport {\\n    position: relative;\\n    overflow: hidden;\\n\\n    display: flex;\\n    flex-grow: 1;\\n\\n    margin: 0;\\n    padding: 0;\\n  }\\n\\n  .dragging {\\n    transition: none;\\n  }\\n</style>"],"names":[],"mappings":"AA6CE,IAAI,cAAC,CAAC,AACJ,gBAAgB,CAAE,GAAG,CAAC,IAAI,CAC1B,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,WAAW,CAChC,MAAM,CAAE,IAAI,AACd,CAAC,AAED,OAAO,cAAC,CAAC,AACP,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,AACX,CAAC,AAED,SAAS,cAAC,CAAC,AACT,QAAQ,CAAE,QAAQ,CAClB,QAAQ,CAAE,MAAM,CAEhB,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,CAAC,CAEZ,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,SAAS,cAAC,CAAC,AACT,UAAU,CAAE,IAAI,AAClB,CAAC"}`
};
var Map2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let w;
  let h;
  let x;
  let y;
  let $size, $$unsubscribe_size;
  let $pos, $$unsubscribe_pos;
  let $$unsubscribe_viewport;
  let $detailsVisible, $$unsubscribe_detailsVisible;
  let $dragging, $$unsubscribe_dragging;
  let $scale, $$unsubscribe_scale;
  $$unsubscribe_size = subscribe(size, (value) => $size = value);
  $$unsubscribe_pos = subscribe(pos, (value) => $pos = value);
  $$unsubscribe_viewport = subscribe(viewport, (value) => value);
  $$unsubscribe_detailsVisible = subscribe(detailsVisible, (value) => $detailsVisible = value);
  $$unsubscribe_dragging = subscribe(dragging, (value) => $dragging = value);
  $$unsubscribe_scale = subscribe(scale, (value) => $scale = value);
  $$result.css.add(css$6);
  w = $size.width;
  h = $size.height;
  x = $pos.x;
  y = $pos.y;
  $$unsubscribe_size();
  $$unsubscribe_pos();
  $$unsubscribe_viewport();
  $$unsubscribe_detailsVisible();
  $$unsubscribe_dragging();
  $$unsubscribe_scale();
  return `<div class="${"viewport svelte-2pognb"}">${$detailsVisible ? `${validate_component(Details, "Details").$$render($$result, {}, {}, {})}` : ``}
  <div class="${"map " + escape2($dragging ? "dragging" : "") + " svelte-2pognb"}" style="${"\n      width: " + escape2(w) + "px;\n      height: " + escape2(h) + "px;\n      translate: -" + escape2(x) + "px -" + escape2(y) + "px;\n      scale: " + escape2($scale) + ";\n    "}"><picture class="${"svelte-2pognb"}"><source type="${"image/webp"}" srcset="${"/img/bg.webp"}">
      <source type="${"image/jpg"}" srcset="${"/img/bg.jpg"}">
      <img src="${"/img/bg.jpg"}" alt="${"map"}"></picture>
    ${validate_component(Markers, "Markers").$$render($$result, {}, {}, {})}</div>
  ${validate_component(UI, "UI").$$render($$result, {}, {}, {})}
</div>`;
});
async function load$4({ page, fetch: fetch3, session, context }) {
  const res = await fetch3(`/data.json`);
  if (res.ok) {
    const { projects, info } = await res.json();
    return { props: { projects, info } };
  }
  return {
    status: 404,
    error: new Error("Page not found")
  };
}
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { projects } = $$props;
  let { info } = $$props;
  setContext("projects", projects);
  setContext("info", info);
  if ($$props.projects === void 0 && $$bindings.projects && projects !== void 0)
    $$bindings.projects(projects);
  if ($$props.info === void 0 && $$bindings.info && info !== void 0)
    $$bindings.info(info);
  return `${validate_component(Sidebar, "Sidebar").$$render($$result, {}, {}, {
    default: () => `${validate_component(Filters, "Filters").$$render($$result, { projects }, {}, {})}`
  })}

${validate_component(Map2, "Map").$$render($$result, {}, {}, {})}`;
});
var index$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  load: load$4
});
var css$5 = {
  code: ".object.svelte-5l7giw{max-width:600px;margin:0 auto}",
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\">\\n  export async function load({ page, fetch }) {\\n    const res = await fetch(`/data/projects.json`);\\n    if (res.ok) {\\n      const projects = await res.json();\\n      return { props: projects };\\n    }\\n    return { status: 404, error: new Error(\\"Page not found\\") };\\n  }\\n<\/script>\\n\\n<script>\\n  export let projects;\\n<\/script>\\n\\n<div class=\\"object\\">\\n  <h3>Projects</h3>\\n  <ul>\\n    {#each projects as project}\\n    <li><a href=\\"projects/{ project }\\">{ project }</a></li>\\n    {/each}\\n  </ul>\\n</div>\\n\\n<style>\\n  .object {\\n    max-width: 600px;\\n    margin: 0 auto;\\n  }\\n</style>"],"names":[],"mappings":"AAyBE,OAAO,cAAC,CAAC,AACP,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,CAAC,CAAC,IAAI,AAChB,CAAC"}'
};
async function load$3({ page, fetch: fetch3 }) {
  const res = await fetch3(`/data/projects.json`);
  if (res.ok) {
    const projects = await res.json();
    return { props: projects };
  }
  return {
    status: 404,
    error: new Error("Page not found")
  };
}
var Projects = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { projects } = $$props;
  if ($$props.projects === void 0 && $$bindings.projects && projects !== void 0)
    $$bindings.projects(projects);
  $$result.css.add(css$5);
  return `<div class="${"object svelte-5l7giw"}"><h3>Projects</h3>
  <ul>${each(projects, (project) => `<li><a href="${"projects/" + escape2(project)}">${escape2(project)}</a></li>`)}</ul>
</div>`;
});
var index$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Projects,
  load: load$3
});
var css$4 = {
  code: ".project.svelte-1cfvgg3{max-width:600px;margin:1rem auto}",
  map: '{"version":3,"file":"[slug].svelte","sources":["[slug].svelte"],"sourcesContent":["<script context=\\"module\\">\\n  export async function load({ page, fetch }) {\\n    const res = await fetch(`/data/projects/${page.params.slug}.json`);\\n    if (res.ok) {\\n      const project = await res.json();\\n      return { props: { project } };\\n    }\\n    return { status: 404, error: new Error(\\"Page not found\\") };\\n  }\\n<\/script>\\n\\n<script>\\n  import Project from \'$lib/elements/Project.svelte\'\\n\\n  export let project;\\n<\/script>\\n\\n<div class=\\"project\\">\\n  <Project { project } closable expanded />\\n</div>\\n\\n<style>\\n  .project {\\n    max-width: 600px;\\n    margin: 1rem auto;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAsBE,QAAQ,eAAC,CAAC,AACR,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,IAAI,CAAC,IAAI,AACnB,CAAC"}'
};
async function load$2({ page, fetch: fetch3 }) {
  const res = await fetch3(`/data/projects/${page.params.slug}.json`);
  if (res.ok) {
    const project = await res.json();
    return { props: { project } };
  }
  return {
    status: 404,
    error: new Error("Page not found")
  };
}
var U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { project } = $$props;
  if ($$props.project === void 0 && $$bindings.project && project !== void 0)
    $$bindings.project(project);
  $$result.css.add(css$4);
  return `<div class="${"project svelte-1cfvgg3"}">${validate_component(Project, "Project").$$render($$result, { project, closable: true, expanded: true }, {}, {})}
</div>`;
});
var _slug_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bslugu5D,
  load: load$2
});
var css$3 = {
  code: ".bg.svelte-1nj2ujq{width:100%;background-color:white;background-image:linear-gradient(#eee 2px, transparent 2px), linear-gradient(90deg, #eee 2px, transparent 2px), linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, white 1px);background-size:10rem 10rem, 10rem 10rem, 2rem 2rem, 2rem 2rem;background-position:2rem 2rem;overflow-y:auto}.projects.svelte-1nj2ujq{display:grid;max-width:88rem;grid-template-columns:repeat(auto-fit, 20rem);grid-auto-rows:20rem;grid-auto-flow:row dense;gap:2rem;padding:2rem;margin:0 auto;justify-content:center}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\">\\n  export async function load({ page, fetch, session, context }) {\\n    const res = await fetch(\`/data.json\`);\\n    if (res.ok) {\\n      const projects = await res.json();\\n      return { props: projects };\\n    }\\n    return { status: 404, error: new Error(\\"Page not found\\") };\\n  }\\n<\/script>\\n\\n<script>\\n  import { setContext, onMount } from \\"svelte\\";\\n  import Project from \\"$lib/elements/Project.svelte\\"\\n\\n  import { browser } from '$app/env';\\n\\n  export let projects\\n  \\n  if (browser) {\\n    onMount(async () => {\\n      const wg = await import('animate-css-grid')\\n      const wrapGrid = wg.default\\n      wrapGrid.wrapGrid(document.querySelector('.projects'));\\n    })\\n  }\\n  \\n  setContext(\\"projects\\", projects)\\n<\/script>\\n\\n<div class=\\"bg\\">\\n  <div \\n    class=\\"projects\\"\\n  >\\n    {#each Object.values(projects) as project (project) }\\n      <Project expandable { project } />\\n    {/each}\\n  </div>\\n</div>\\n\\n<style>\\n  .bg {\\n    width: 100%;\\n    background-color: white;\\n\\n    background-image:  linear-gradient(#eee 2px, transparent 2px), linear-gradient(90deg, #eee 2px, transparent 2px), linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, white 1px);\\n    background-size: 10rem 10rem, 10rem 10rem, 2rem 2rem, 2rem 2rem;\\n    background-position: 2rem 2rem;\\n    overflow-y: auto;\\n  }\\n\\n  .projects {\\n    display: grid;\\n    max-width: 88rem;\\n    grid-template-columns: repeat(auto-fit, 20rem);\\n    grid-auto-rows: 20rem;\\n    grid-auto-flow: row dense;\\n    gap: 2rem;\\n    padding: 2rem;\\n    margin: 0 auto;\\n    justify-content: center;\\n  }\\n</style>"],"names":[],"mappings":"AAyCE,GAAG,eAAC,CAAC,AACH,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,KAAK,CAEvB,gBAAgB,CAAG,gBAAgB,IAAI,CAAC,GAAG,CAAC,CAAC,WAAW,CAAC,GAAG,CAAC,CAAC,CAAC,gBAAgB,KAAK,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,WAAW,CAAC,GAAG,CAAC,CAAC,CAAC,gBAAgB,IAAI,CAAC,GAAG,CAAC,CAAC,WAAW,CAAC,GAAG,CAAC,CAAC,CAAC,gBAAgB,KAAK,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,KAAK,CAAC,GAAG,CAAC,CACzM,eAAe,CAAE,KAAK,CAAC,KAAK,CAAC,CAAC,KAAK,CAAC,KAAK,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,IAAI,CAAC,IAAI,CAC/D,mBAAmB,CAAE,IAAI,CAAC,IAAI,CAC9B,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,SAAS,eAAC,CAAC,AACT,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,KAAK,CAChB,qBAAqB,CAAE,OAAO,QAAQ,CAAC,CAAC,KAAK,CAAC,CAC9C,cAAc,CAAE,KAAK,CACrB,cAAc,CAAE,GAAG,CAAC,KAAK,CACzB,GAAG,CAAE,IAAI,CACT,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,eAAe,CAAE,MAAM,AACzB,CAAC"}`
};
async function load$1({ page, fetch: fetch3, session, context }) {
  const res = await fetch3(`/data.json`);
  if (res.ok) {
    const projects = await res.json();
    return { props: projects };
  }
  return {
    status: 404,
    error: new Error("Page not found")
  };
}
var Archive = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { projects } = $$props;
  setContext("projects", projects);
  if ($$props.projects === void 0 && $$bindings.projects && projects !== void 0)
    $$bindings.projects(projects);
  $$result.css.add(css$3);
  return `<div class="${"bg svelte-1nj2ujq"}"><div class="${"projects svelte-1nj2ujq"}">${each(Object.values(projects), (project) => `${validate_component(Project, "Project").$$render($$result, { expandable: true, project }, {}, {})}`)}</div>
</div>`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Archive,
  load: load$1
});
var Data = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Data
});
var css$2 = {
  code: '.chapters.svelte-1ppycrv.svelte-1ppycrv{border-right:1px solid black;background-color:white;height:100%;width:100%}header.svelte-1ppycrv.svelte-1ppycrv{display:flex;align-items:center;font-weight:bold;color:black;margin:24px 16px 8px 16px;border-bottom:1px solid black}header.svelte-1ppycrv span.svelte-1ppycrv{margin-bottom:4px}ul.svelte-1ppycrv.svelte-1ppycrv{list-style:none;padding-left:1rem}li.svelte-1ppycrv.svelte-1ppycrv{margin:0.25rem 0}li.svelte-1ppycrv.svelte-1ppycrv::before{content:"> ";margin-right:0.25rem}',
  map: '{"version":3,"file":"Chapters.svelte","sources":["Chapters.svelte"],"sourcesContent":["<script>\\n  export let chapters = []\\n<\/script>\\n\\n<div class=\\"chapters\\">\\n  <header><span>Chapters</span></header>\\n  <ul>\\n    {#each chapters as chapter}  \\n      <a href=\\"#{chapter.split(\\". \\")[1]}\\" rel=\\"external\\"><li>{ chapter.split(\\". \\")[1] }</li></a>\\n    {/each}\\n  </ul>\\n</div>\\n\\n<style>\\n  .chapters {\\n    border-right: 1px solid black;\\n    background-color: white;\\n    height: 100%;\\n    width: 100%;\\n  }\\n\\n  header {\\n    display: flex;\\n    align-items: center;\\n    font-weight: bold;\\n    color: black;\\n    margin: 24px 16px 8px 16px;\\n    border-bottom: 1px solid black;\\n  }\\n\\n  header span {\\n    margin-bottom: 4px;\\n  }\\n\\n  ul {\\n    list-style: none;\\n    padding-left: 1rem;\\n  }\\n\\n  li {\\n    margin: 0.25rem 0;\\n  }\\n\\n  li::before {\\n    content: \\"> \\";\\n    margin-right: 0.25rem;\\n  }\\n</style>"],"names":[],"mappings":"AAcE,SAAS,8BAAC,CAAC,AACT,YAAY,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,CAC7B,gBAAgB,CAAE,KAAK,CACvB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,AACb,CAAC,AAED,MAAM,8BAAC,CAAC,AACN,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,IAAI,CAAC,IAAI,CAAC,GAAG,CAAC,IAAI,CAC1B,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,AAChC,CAAC,AAED,qBAAM,CAAC,IAAI,eAAC,CAAC,AACX,aAAa,CAAE,GAAG,AACpB,CAAC,AAED,EAAE,8BAAC,CAAC,AACF,UAAU,CAAE,IAAI,CAChB,YAAY,CAAE,IAAI,AACpB,CAAC,AAED,EAAE,8BAAC,CAAC,AACF,MAAM,CAAE,OAAO,CAAC,CAAC,AACnB,CAAC,AAED,gCAAE,QAAQ,AAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,YAAY,CAAE,OAAO,AACvB,CAAC"}'
};
var Chapters = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { chapters = [] } = $$props;
  if ($$props.chapters === void 0 && $$bindings.chapters && chapters !== void 0)
    $$bindings.chapters(chapters);
  $$result.css.add(css$2);
  return `<div class="${"chapters svelte-1ppycrv"}"><header class="${"svelte-1ppycrv"}"><span class="${"svelte-1ppycrv"}">Chapters</span></header>
  <ul class="${"svelte-1ppycrv"}">${each(chapters, (chapter) => `<a href="${"#" + escape2(chapter.split(". ")[1])}" rel="${"external"}"><li class="${"svelte-1ppycrv"}">${escape2(chapter.split(". ")[1])}</li></a>`)}</ul>
</div>`;
});
var css$1 = {
  code: "article.svelte-1aict9q{display:flex}h4.svelte-1aict9q{text-transform:uppercase}.text.svelte-1aict9q{background-color:white;width:50%;border-right:var(--border);padding-bottom:2rem}.images.svelte-1aict9q{width:50%}.inner.svelte-1aict9q{width:80%;margin:2rem auto}img.svelte-1aict9q{border:var(--border);width:100%;height:auto;background-color:white}.inner.info.img.svelte-1aict9q{text-align:center}.inner.info.markdown.svelte-1aict9q{position:sticky;position:-webkit-sticky;top:2rem}.inner.info > *{margin-bottom:1rem}.inner.info > h1{font-size:3rem}",
  map: `{"version":3,"file":"Info.svelte","sources":["Info.svelte"],"sourcesContent":["<script>\\n  import marked from 'marked';\\n\\n  export let info\\n  export let id\\n\\n  const title = info.frontmatter.title\\n  const images = info.frontmatter.images\\n  const content = marked( info.content )\\n<\/script>\\n\\n<article id=\\"{id.split(\\". \\")[1]}\\">\\n  <div class=\\"text\\">\\n    <div class=\\"inner info markdown\\">\\n      <h4>{title}</h4>\\n      {@html content}\\n    </div>\\n  </div>\\n  <div class=\\"images\\">\\n    <div class=\\"inner info img\\">\\n      {#each images as image}\\n        <img src=\\"/img/{image}\\" alt=\\"{image}\\" />\\n      {/each}\\n    </div>\\n  </div>\\n</article>\\n\\n<style>\\n  article {\\n    display: flex;\\n  }\\n\\n  h4 {\\n    text-transform: uppercase;\\n  }\\n\\n  .text {\\n    background-color: white;\\n    width: 50%;\\n\\n    /* boxed layout */\\n    /* padding: 1rem;\\n    border: var(--border);\\n    margin: 2rem; */\\n\\n    /* continuous layout */\\n    border-right: var(--border);\\n    padding-bottom: 2rem;\\n    \\n  }\\n  \\n  .images {\\n    width: 50%;\\n  }\\n\\n  .inner {\\n    width: 80%;\\n    margin: 2rem auto;\\n  }\\n\\n  img {\\n    border: var(--border);\\n    width: 100%;\\n    height: auto;\\n    background-color: white;\\n  }\\n\\n  .inner.info.img {\\n    text-align: center;\\n  }\\n\\n  .inner.info.markdown {\\n    position: sticky;\\n    position: -webkit-sticky;\\n    top: 2rem;\\n  }\\n\\n  :global(.inner.info > *) {\\n    margin-bottom: 1rem;\\n  }\\n\\n  :global(.inner.info > h1) {\\n    font-size: 3rem;\\n  }\\n</style>"],"names":[],"mappings":"AA4BE,OAAO,eAAC,CAAC,AACP,OAAO,CAAE,IAAI,AACf,CAAC,AAED,EAAE,eAAC,CAAC,AACF,cAAc,CAAE,SAAS,AAC3B,CAAC,AAED,KAAK,eAAC,CAAC,AACL,gBAAgB,CAAE,KAAK,CACvB,KAAK,CAAE,GAAG,CAQV,YAAY,CAAE,IAAI,QAAQ,CAAC,CAC3B,cAAc,CAAE,IAAI,AAEtB,CAAC,AAED,OAAO,eAAC,CAAC,AACP,KAAK,CAAE,GAAG,AACZ,CAAC,AAED,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,IAAI,CAAC,IAAI,AACnB,CAAC,AAED,GAAG,eAAC,CAAC,AACH,MAAM,CAAE,IAAI,QAAQ,CAAC,CACrB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,KAAK,AACzB,CAAC,AAED,MAAM,KAAK,IAAI,eAAC,CAAC,AACf,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,MAAM,KAAK,SAAS,eAAC,CAAC,AACpB,QAAQ,CAAE,MAAM,CAChB,QAAQ,CAAE,cAAc,CACxB,GAAG,CAAE,IAAI,AACX,CAAC,AAEO,eAAe,AAAE,CAAC,AACxB,aAAa,CAAE,IAAI,AACrB,CAAC,AAEO,gBAAgB,AAAE,CAAC,AACzB,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var Info = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { info } = $$props;
  let { id } = $$props;
  const title = info.frontmatter.title;
  const images = info.frontmatter.images;
  const content = (0, import_marked.default)(info.content);
  if ($$props.info === void 0 && $$bindings.info && info !== void 0)
    $$bindings.info(info);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  $$result.css.add(css$1);
  return `<article${add_attribute("id", id.split(". ")[1], 0)} class="${"svelte-1aict9q"}"><div class="${"text svelte-1aict9q"}"><div class="${"inner info markdown svelte-1aict9q"}"><h4 class="${"svelte-1aict9q"}">${escape2(title)}</h4>
      ${content}</div></div>
  <div class="${"images svelte-1aict9q"}"><div class="${"inner info img svelte-1aict9q"}">${each(images, (image) => `<img src="${"/img/" + escape2(image)}"${add_attribute("alt", image, 0)} class="${"svelte-1aict9q"}">`)}</div></div>
</article>`;
});
var css = {
  code: "div.svelte-1f4xbsz{display:flex;flex-direction:column;overflow-y:auto;width:100%;background-image:linear-gradient(#eee 2px, transparent 2px), linear-gradient(90deg, #eee 2px, transparent 2px), linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, white 1px);background-size:10rem 10rem, 10rem 10rem, 2rem 2rem, 2rem 2rem;background-position:2rem 2rem}",
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\">\\n  export async function load({ page, fetch, session, context }) {\\n    const res = await fetch(`/data.json`);\\n    if (res.ok) {\\n      const {projects, info} = await res.json();\\n      return { props: {projects, info} };\\n    }\\n    return { status: 404, error: new Error(\\"Page not found\\") };\\n  }\\n<\/script>\\n\\n<script>\\n  import Sidebar from \\"$lib/elements/Sidebar.svelte\\"\\n  import Chapters from \\"$lib/elements/Chapters.svelte\\"\\n  import Info from \\"$lib/elements/Info.svelte\\"\\n  \\n  export let info\\n\\n  let chapters = Object.keys(info)\\n  let infoObjects = Object.entries(info)\\n<\/script>\\n\\n<Sidebar>\\n  <Chapters { chapters } />\\n</Sidebar>\\n\\n<div>\\n  {#each infoObjects as info}\\n    <Info info={info[1]} id={info[0]} />\\n  {/each}\\n</div>\\n\\n<style>\\n  div {\\n    display: flex;\\n    flex-direction: column;\\n    overflow-y: auto;\\n    width: 100%;\\n\\n    background-image:  linear-gradient(#eee 2px, transparent 2px), linear-gradient(90deg, #eee 2px, transparent 2px), linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, white 1px);\\n    background-size: 10rem 10rem, 10rem 10rem, 2rem 2rem, 2rem 2rem;\\n    background-position: 2rem 2rem;\\n  }\\n</style>"],"names":[],"mappings":"AAiCE,GAAG,eAAC,CAAC,AACH,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,IAAI,CAChB,KAAK,CAAE,IAAI,CAEX,gBAAgB,CAAG,gBAAgB,IAAI,CAAC,GAAG,CAAC,CAAC,WAAW,CAAC,GAAG,CAAC,CAAC,CAAC,gBAAgB,KAAK,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,WAAW,CAAC,GAAG,CAAC,CAAC,CAAC,gBAAgB,IAAI,CAAC,GAAG,CAAC,CAAC,WAAW,CAAC,GAAG,CAAC,CAAC,CAAC,gBAAgB,KAAK,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,KAAK,CAAC,GAAG,CAAC,CACzM,eAAe,CAAE,KAAK,CAAC,KAAK,CAAC,CAAC,KAAK,CAAC,KAAK,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,IAAI,CAAC,IAAI,CAC/D,mBAAmB,CAAE,IAAI,CAAC,IAAI,AAChC,CAAC"}'
};
async function load({ page, fetch: fetch3, session, context }) {
  const res = await fetch3(`/data.json`);
  if (res.ok) {
    const { projects, info } = await res.json();
    return { props: { projects, info } };
  }
  return {
    status: 404,
    error: new Error("Page not found")
  };
}
var Info_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { info } = $$props;
  let chapters = Object.keys(info);
  let infoObjects = Object.entries(info);
  if ($$props.info === void 0 && $$bindings.info && info !== void 0)
    $$bindings.info(info);
  $$result.css.add(css);
  return `${validate_component(Sidebar, "Sidebar").$$render($$result, {}, {}, {
    default: () => `${validate_component(Chapters, "Chapters").$$render($$result, { chapters }, {}, {})}`
  })}

<div class="${"svelte-1f4xbsz"}">${each(infoObjects, (info2) => `${validate_component(Info, "Info").$$render($$result, { info: info2[1], id: info2[0] }, {}, {})}`)}
</div>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Info_1,
  load
});

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body;
  try {
    body = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body
  });
  if (rendered) {
    const { status, headers, body: body2 } = rendered;
    return res.writeHead(status, headers).end(body2);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
