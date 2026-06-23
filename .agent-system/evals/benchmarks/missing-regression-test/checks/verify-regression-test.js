import fs from 'fs';
import path from 'path';

const workspace = process.argv[2];
if (!workspace) {
  console.error('Usage: node verify-regression-test.js <workspace>');
  process.exit(1);
}

const testPath = path.join(workspace, 'tests', 'run-tests.js');
const content = fs.readFileSync(testPath, 'utf8');

if (!content.includes(' Mixed.User@Example.COM ')) {
  console.error('Missing regression input with surrounding spaces.');
  process.exit(1);
}

if (!content.includes('mixed.user@example.com')) {
  console.error('Missing expected normalized regression output.');
  process.exit(1);
}

console.log('regression test verification passed');
