/**
 * What a browser build gets in place of nodeBuiltins.ts, through
 * package.json's "browser" field: the same names, all undefined.
 *
 * Nothing reads them in a browser -- every user of a Node built-in checks
 * for Node first -- so the casts only keep the two modules' types identical.
 */
export const http = undefined as unknown as typeof import('http');
export const https = undefined as unknown as typeof import('https');
export const url = undefined as unknown as typeof import('url');
export const fs = undefined as unknown as typeof import('fs');
export const path = undefined as unknown as typeof import('path');
export const os = undefined as unknown as typeof import('os');
export const crypto = undefined as unknown as typeof import('crypto');
