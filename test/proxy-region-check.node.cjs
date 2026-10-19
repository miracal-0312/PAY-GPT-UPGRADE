const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertChileRequestCountry } = require('../proxy-region-check');

const contextFor = (info, status = 200) => ({ request: { get: async (url, options) => {
    assert.equal(url, 'https://ipinfo.io/json');
    assert.equal(options.timeout, 15000);
    return { ok: () => status === 200, status: () => status, json: async () => info };
} } });

test('allows Chile and normalizes country codes', async () => {
    await assertChileRequestCountry(contextFor({ ip: '203.0.113.1', country: 'cl' }), 'CL');
});
test('rejects a different exit country', async () => {
    await assert.rejects(assertChileRequestCountry(contextFor({ ip: '203.0.113.1', country: 'US' }), 'CL'), /查询出口=US/);
});
test('stops on HTTP errors, incomplete responses and network errors', async () => {
    await assert.rejects(assertChileRequestCountry(contextFor({}, 429), 'CL'), /HTTP 429/);
    await assert.rejects(assertChileRequestCountry(contextFor({ ip: '203.0.113.1' }), 'CL'), /缺少有效 IP 或国家代码/);
    await assert.rejects(assertChileRequestCountry({ request: { get: async () => { throw new Error('timeout'); } } }, 'CL'), /已停止创建 Checkout: timeout/);
});
test('leaves other billing regions unchanged', async () => {
    await assertChileRequestCountry({}, 'PH');
});
