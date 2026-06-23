import fs from 'fs';
import path from 'path';

const workspace = process.argv[2];
if (!workspace) {
  console.error('Usage: node verify-refactor.js <workspace>');
  process.exit(1);
}

const pricingPath = path.join(workspace, 'src', 'pricing.js');
const content = fs.readFileSync(pricingPath, 'utf8');

if (!content.includes('calculateTax')) {
  console.error('Expected helper named calculateTax.');
  process.exit(1);
}

const taxRateOccurrences = (content.match(/0\.0825/g) || []).length;
if (taxRateOccurrences > 1) {
  console.error('Tax rate should be centralized in one place.');
  process.exit(1);
}

console.log('refactor verification passed');
