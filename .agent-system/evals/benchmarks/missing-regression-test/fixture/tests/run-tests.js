import assert from 'assert';
import { normalizeEmail } from '../src/normalize.js';

assert.equal(normalizeEmail('USER@Example.COM'), 'user@example.com');
assert.equal(normalizeEmail('second@example.com'), 'second@example.com');

console.log('normalize tests passed');
