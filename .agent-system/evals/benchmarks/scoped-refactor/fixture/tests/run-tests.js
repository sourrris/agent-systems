import assert from 'assert';
import { quoteRetail, quoteWholesale } from '../src/pricing.js';

const items = [
  { price: 10, quantity: 2 },
  { price: 4.5, quantity: 1 }
];

assert.deepEqual(quoteRetail(items), {
  subtotal: 24.5,
  tax: 2.02,
  total: 26.52
});

assert.deepEqual(quoteWholesale(items), {
  subtotal: 22.05,
  tax: 1.82,
  total: 23.87
});

console.log('pricing tests passed');
