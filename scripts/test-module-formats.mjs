import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const esmEntry = pathToFileURL(resolve('dist/esm/index.js')).href;
const esm = await import(esmEntry);

assert.equal(typeof esm.AkinatorClient, 'function', 'ESM must export AkinatorClient');
assert.ok(esm.Answers, 'ESM must export Answers');

const require = createRequire(import.meta.url);
const cjs = require('../dist/cjs/index.js');

assert.equal(typeof cjs.AkinatorClient, 'function', 'CommonJS must export AkinatorClient');
assert.ok(cjs.Answers, 'CommonJS must export Answers');

console.log('ESM and CommonJS entry points loaded successfully.');
