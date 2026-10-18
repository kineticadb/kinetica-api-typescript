/**
 * HTTP Transport abstraction for cross-platform support.
 */

export interface HttpRequestOptions {
    method: 'GET' | 'POST';
    url: string;
    headers: Record<string, string>;
    /** Request body, as text */
    body?: string;
    /**
     * Request body, as bytes: set in place of `body` by a client constructed
     * with `encoding: 'binary'`. A custom transport serving such a client must
     * send these unchanged.
     */
    bytes?: Uint8Array;
    timeout?: number;
    /**
     * 'binary' also fills in `bytes` on the response, for responses that are
     * not text -- WMS images, and the Avro a binary-encoding client receives.
     * Decoding those as text would corrupt them.
     */
    responseType?: 'text' | 'binary';
    /**
     * Abandon the response once it passes this many bytes, rejecting with a
     * ResponseTooLargeError. 0 or omitted means no ceiling.
     */
    maxResponseBytes?: number;
}

/**
 * Thrown when a response passes the `max_response_bytes` ceiling.
 *
 * A distinct type because the client has to tell this apart from an ordinary
 * transport failure: an oversized result is a property of the query, not of
 * the URL that served it, so failing over would run the same expensive query
 * against every node in the ring.
 */
export class ResponseTooLargeError extends Error {
    /** The configured ceiling, in bytes */
    public readonly limit: number;
    /**
     * Bytes counted before the read was abandoned. A lower bound on the true
     * size, except when it came from a Content-Length header.
     */
    public readonly received: number;

    constructor(limit: number, received: number) {
        super(
            `Response exceeded max_response_bytes: the limit is ${limit} bytes, `
            + `and at least ${received} were received. Narrow the query, page `
            + 'through the results, or raise max_response_bytes.'
        );
        this.name = 'ResponseTooLargeError';
        this.limit = limit;
        this.received = received;
    }
}

export interface HttpResponse {
    status: number;
    statusText: string;
    body: string;
    headers: Record<string, string>;
    /** Raw response bytes; present when 'binary' was requested */
    bytes?: Uint8Array;
}

export interface HttpTransport {
    request(options: HttpRequestOptions): Promise<HttpResponse>;
    /**
     * Blocking counterpart of `request`, where the environment can provide
     * one. Only BrowserHttpTransport implements it, via a synchronous
     * XMLHttpRequest; `fetch` has no synchronous mode.
     */
    requestSync?(options: HttpRequestOptions): HttpResponse;
}

/**
 * Detect the runtime environment and create appropriate transport.
 */
export function createTransport(): HttpTransport {
    // Check for Node.js environment
    if (typeof process !== 'undefined' && process.versions?.node) {
        return new NodeHttpTransport();
    }
    // Browser environment
    return new BrowserHttpTransport();
}

/**
 * Browser HTTP transport using fetch API.
 */
export class BrowserHttpTransport implements HttpTransport {
    async request(options: HttpRequestOptions): Promise<HttpResponse> {
        const controller = new AbortController();
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (options.timeout && options.timeout > 0) {
            timeoutId = setTimeout(() => controller.abort(), options.timeout);
        }

        try {
            const response = await fetch(options.url, {
                method: options.method,
                headers: options.headers,
                // A Uint8Array is a valid body. The cast is only for the
                // typings, which want its buffer to be a plain ArrayBuffer
                body: (options.bytes ?? options.body) as RequestInit['body'],
                signal: controller.signal,
            });

            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key.toLowerCase()] = value;
            });

            const limit = options.maxResponseBytes ?? 0;

            // Without a ceiling the body is read with the plain helpers, so
            // the common path keeps fetch's own charset handling
            if (limit > 0) {
                const bytes = await BrowserHttpTransport.readCapped(response, limit);
                return {
                    status: response.status,
                    statusText: response.statusText,
                    body: options.responseType === 'binary'
                        ? ''
                        : new TextDecoder().decode(bytes),
                    headers,
                    bytes: options.responseType === 'binary' ? bytes : undefined,
                };
            }

            if (options.responseType === 'binary') {
                const bytes = new Uint8Array(await response.arrayBuffer());
                return {
                    status: response.status,
                    statusText: response.statusText,
                    body: '',
                    headers,
                    bytes,
                };
            }

            const body = await response.text();

            return {
                status: response.status,
                statusText: response.statusText,
                body,
                headers,
            };
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }

    /**
     * Reads a response body, abandoning it once it passes `limit` bytes.
     *
     * Streaming is the point: the read stops partway rather than buffering the
     * whole payload and measuring it afterwards, which is what makes the
     * ceiling worth setting.
     */
    private static async readCapped(response: Response, limit: number): Promise<Uint8Array> {
        // Cheapest check first -- a declared length settles it without
        // reading a byte
        const declared = Number(response.headers.get('content-length'));
        if (Number.isFinite(declared) && declared > limit) {
            throw new ResponseTooLargeError(limit, declared);
        }

        if (!response.body) {
            // No stream to read (older browsers, some polyfills). Buffer and
            // check afterwards: the request still fails, it just fails late.
            const buffered = new Uint8Array(await response.arrayBuffer());
            if (buffered.length > limit) {
                throw new ResponseTooLargeError(limit, buffered.length);
            }
            return buffered;
        }

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        for (;;) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            if (!value) {
                continue;
            }

            received += value.length;
            if (received > limit) {
                // Releases the connection instead of draining a body already
                // known to be unusable
                await reader.cancel();
                throw new ResponseTooLargeError(limit, received);
            }
            chunks.push(value);
        }

        const body = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
            body.set(chunk, offset);
            offset += chunk.length;
        }
        return body;
    }

    /**
     * Blocking request, for legacy code that expects a return value rather
     * than a promise. Uses a synchronous XMLHttpRequest, which browsers still
     * support but have deprecated: it blocks the UI thread. Only reachable
     * when the client was constructed with `sync: true`, which the standalone
     * build does by default.
     *
     * XMLHttpRequest is looked up on globalThis so this file still compiles
     * for the Node build, whose lib does not include the DOM.
     */
    requestSync(options: HttpRequestOptions): HttpResponse {
        const XhrConstructor = (globalThis as any).XMLHttpRequest;

        if (typeof XhrConstructor !== 'function') {
            throw new Error(
                'Synchronous requests need XMLHttpRequest, which this '
                + 'environment does not provide. Use the promise or callback '
                + 'form instead.'
            );
        }

        const xhr = new XhrConstructor();
        xhr.open(options.method, options.url, false);

        for (const [name, value] of Object.entries(options.headers)) {
            // The browser sets these itself and rejects attempts to override
            if (name === 'User-Agent' || name === 'Cookie') {
                continue;
            }
            xhr.setRequestHeader(name, value);
        }

        // A synchronous request cannot ask for an ArrayBuffer response, so a
        // binary body is read as text under a charset that maps each byte to
        // one character, and unpacked below
        const binary = options.responseType === 'binary';
        if (binary) {
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
        }

        xhr.send(options.bytes ?? options.body ?? null);

        const headers: Record<string, string> = {};
        const raw: string = xhr.getAllResponseHeaders() || '';
        for (const line of raw.trim().split(/[\r\n]+/)) {
            const separator = line.indexOf(': ');
            if (separator > 0) {
                headers[line.slice(0, separator).toLowerCase()] = line.slice(separator + 2);
            }
        }

        const limit = options.maxResponseBytes ?? 0;
        if (limit > 0) {
            // A synchronous XMLHttpRequest has already buffered the whole body
            // by the time send() returns, so the ceiling can only be reported,
            // not enforced. Prefer the declared length; otherwise fall back to
            // the character count, which under-counts multi-byte UTF-8 and so
            // errs towards letting a marginal response through rather than
            // rejecting one that fits.
            const declared = Number(headers['content-length']);
            const size = Number.isFinite(declared) && declared > 0
                ? declared
                : xhr.responseText.length;

            if (size > limit) {
                throw new ResponseTooLargeError(limit, size);
            }
        }

        if (binary) {
            const text: string = xhr.responseText;
            const bytes = new Uint8Array(text.length);
            for (let i = 0; i < text.length; i++) {
                bytes[i] = text.charCodeAt(i) & 0xff;
            }
            return {
                status: xhr.status,
                statusText: xhr.statusText,
                body: '',
                headers,
                bytes,
            };
        }

        return {
            status: xhr.status,
            statusText: xhr.statusText,
            body: xhr.responseText,
            headers,
        };
    }
}

/**
 * Node.js HTTP transport using http/https modules.
 */
export class NodeHttpTransport implements HttpTransport {
    async request(options: HttpRequestOptions): Promise<HttpResponse> {
        // Dynamic import for Node.js modules
        const url = await import('url');
        const parsedUrl = new url.URL(options.url);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps
            ? await import('https')
            : await import('http');

        return new Promise((resolve, reject) => {
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method,
                headers: options.headers,
            };

            const limit = options.maxResponseBytes ?? 0;
            // Set once the ceiling is hit: the promise has been rejected, and
            // the socket teardown that follows must not reject it again with
            // its own error
            let abandoned = false;

            const req = httpModule.request(requestOptions, (res) => {
                const chunks: Buffer[] = [];
                let received = 0;

                res.on('data', (chunk: Buffer) => {
                    if (abandoned) {
                        return;
                    }

                    received += chunk.length;

                    if (limit > 0 && received > limit) {
                        abandoned = true;
                        // Tear the request down rather than buffering the rest
                        // of a response already known to be unusable
                        req.destroy();
                        reject(new ResponseTooLargeError(limit, received));
                        return;
                    }

                    chunks.push(chunk);
                });
                res.on('end', () => {
                    if (abandoned) {
                        return;
                    }

                    const headers: Record<string, string> = {};
                    for (const [key, value] of Object.entries(res.headers)) {
                        if (typeof value === 'string') {
                            headers[key.toLowerCase()] = value;
                        } else if (Array.isArray(value)) {
                            headers[key.toLowerCase()] = value.join(', ');
                        }
                    }

                    const payload = Buffer.concat(chunks);

                    resolve({
                        status: res.statusCode || 0,
                        statusText: res.statusMessage || '',
                        // Decoding bytes as text would corrupt an image
                        body: options.responseType === 'binary' ? '' : payload.toString(),
                        headers,
                        // The Buffer is handed back as-is rather than copied
                        // into a plain Uint8Array. Buffer is a Uint8Array
                        // subclass, so the declared type still holds, and
                        // keeping it means toString() decodes UTF-8 the way
                        // the JavaScript API's callers expect -- a plain
                        // Uint8Array joins its bytes as "60,63,120,...", which
                        // turns a check like
                        // `image.toString().includes('ServiceException')`
                        // into a silent false.
                        bytes: options.responseType === 'binary'
                            ? payload
                            : undefined,
                    });
                });
            });

            req.on('error', (err) => {
                if (!abandoned) {
                    reject(err);
                }
            });

            if (options.timeout && options.timeout > 0) {
                req.setTimeout(options.timeout, () => {
                    req.destroy(new Error('Request timeout'));
                });
            }

            const body = options.bytes ?? options.body;
            if (body) {
                req.write(body);
            }
            req.end();
        });
    }
}
