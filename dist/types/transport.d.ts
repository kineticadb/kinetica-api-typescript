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
export declare class ResponseTooLargeError extends Error {
    /** The configured ceiling, in bytes */
    readonly limit: number;
    /**
     * Bytes counted before the read was abandoned. A lower bound on the true
     * size, except when it came from a Content-Length header.
     */
    readonly received: number;
    constructor(limit: number, received: number);
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
export declare function createTransport(): HttpTransport;
/**
 * Browser HTTP transport using fetch API.
 */
export declare class BrowserHttpTransport implements HttpTransport {
    request(options: HttpRequestOptions): Promise<HttpResponse>;
    /**
     * Reads a response body, abandoning it once it passes `limit` bytes.
     *
     * Streaming is the point: the read stops partway rather than buffering the
     * whole payload and measuring it afterwards, which is what makes the
     * ceiling worth setting.
     */
    private static readCapped;
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
    requestSync(options: HttpRequestOptions): HttpResponse;
}
/**
 * Node.js HTTP transport using http/https modules.
 */
export declare class NodeHttpTransport implements HttpTransport {
    request(options: HttpRequestOptions): Promise<HttpResponse>;
}
