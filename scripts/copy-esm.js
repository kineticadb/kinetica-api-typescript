/**
 * Copies the ES module entry point into dist/.
 *
 * Run by `npm run build:esm`. The files are written as .mjs/.d.mts to begin
 * with and need no compilation, only placing next to the builds they
 * re-export. Copied rather than compiled because they are already
 * JavaScript, and tsc would rewrite their import of the CommonJS build.
 * Written in Node rather than shell so it runs wherever npm does.
 */

const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'src', 'esm');
const destination = path.join(__dirname, '..', 'dist', 'esm');

fs.mkdirSync(destination, { recursive: true });

for (const entry of fs.readdirSync(source)) {
    fs.copyFileSync(path.join(source, entry), path.join(destination, entry));
}
