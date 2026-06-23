import assert from 'assert';
import { serializeCreate, serializeUpdate } from '../src/serializer.js';

const createPayload = serializeCreate({
  name: 'Ada',
  timezone: 'Asia/Kolkata',
  active: false
});

assert.deepEqual(createPayload, {
  name: 'Ada',
  timezone: 'Asia/Kolkata',
  active: false
});

const updatePayload = serializeUpdate({
  name: 'Ada Lovelace',
  timezone: 'America/New_York'
});

assert.deepEqual(updatePayload, {
  name: 'Ada Lovelace',
  timezone: 'America/New_York'
});

console.log('serializer tests passed');
