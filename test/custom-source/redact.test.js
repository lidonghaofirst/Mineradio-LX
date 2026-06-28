const test = require('node:test');
const assert = require('node:assert/strict');
const { redactSecrets } = require('../../desktop/custom-source/redact');

test('redacts nested credentials without mutating input', () => {
  const input = { headers: { Authorization: 'Bearer abc', Cookie: 'a=b', Accept: 'json' }, access_token: 'secret' };
  const output = redactSecrets(input);
  assert.equal(output.headers.Authorization, '[REDACTED]');
  assert.equal(output.headers.Cookie, '[REDACTED]');
  assert.equal(output.headers.Accept, 'json');
  assert.equal(output.access_token, '[REDACTED]');
  assert.equal(input.access_token, 'secret');
});
