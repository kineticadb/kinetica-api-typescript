/**
 * What a browser build gets in place of nodeBuiltins.ts, through
 * package.json's "browser" field: the same names, all undefined.
 *
 * Nothing reads them in a browser -- every user of a Node built-in checks
 * for Node first -- so the casts only keep the two modules' types identical.
 */
export const http = undefined;
export const https = undefined;
export const url = undefined;
export const fs = undefined;
export const path = undefined;
export const os = undefined;
export const crypto = undefined;
