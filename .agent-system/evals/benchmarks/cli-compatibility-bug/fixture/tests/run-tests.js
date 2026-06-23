import assert from 'assert';
import { main } from '../bin/tool.js';

assert.equal(main(['--version']), 'v1.0.0');
assert.equal(main(['init', '--version']), 'v1.0.0');
assert.equal(main(['init', '-v']), 'v1.0.0');
assert.equal(main(['--help']), 'Usage: tool init [path]');
assert.equal(main(['init', '--help']), 'Usage: tool init [path]');
assert.equal(main(['init', './demo']), 'init ./demo');
assert.equal(main(['./demo']), 'init ./demo');

console.log('cli tests passed');
