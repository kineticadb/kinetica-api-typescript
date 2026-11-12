/**
 * What a browser build gets in place of nodeBuiltins.ts, through
 * package.json's "browser" field: the same names, all undefined.
 *
 * Nothing reads them in a browser -- every user of a Node built-in checks
 * for Node first -- so the casts only keep the two modules' types identical.
 */
export declare const http: typeof import("http");
export declare const https: typeof import("https");
export declare const url: typeof import("url");
export declare const fs: typeof import("fs");
export declare const path: typeof import("path");
export declare const os: typeof import("os");
export declare const crypto: typeof import("crypto");
