import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { formatVtpDate, buildVtpPayload, sendWebhook, VTP_STATUS_MAP } from '../lib/webhook.js';

describe('ViettelPost Webhook Helper Tests', () => {
  test('formatVtpDate should format date as DD/MM/YYYY HH:mm:ss', () => {
    const fixedDate = new Date(2026, 8, 29, 13, 0, 0); // Month is 0-indexed: 8 is September
    const formatted = formatVtpDate(fixedDate);
    assert.equal(formatted, '29/09/2026 13:00:00');
  });

  test('buildVtpPayload creates valid payload for Code 200', () => {
    const payload = buildVtpPayload({
      token: 'test-token',
      orderNumber: '303296563226',
      orderStatus: 200,
      statusDate: '29/09/2026 13:00:00'
    });

    assert.deepEqual(payload, {
      TOKEN: 'test-token',
      DATA: {
        ORDER_NUMBER: '303296563226',
        ORDER_STATUSDATE: '29/09/2026 13:00:00',
        ORDER_STATUS: 200,
        STATUS_NAME: 'Đã lấy hàng'
      }
    });
  });

  test('buildVtpPayload handles TRACKING-NOT-FOUND when orderNumber is empty', () => {
    const payload = buildVtpPayload({
      token: 'xxx',
      orderNumber: '',
      orderStatus: 200,
      statusDate: '29/09/2026 13:00:00'
    });

    assert.equal(payload.DATA.ORDER_NUMBER, 'TRACKING-NOT-FOUND');
    assert.equal(payload.DATA.ORDER_STATUS, 200);
  });

  test('buildVtpPayload correctly maps all standard status codes', () => {
    const codes = [200, 500, 501, 506, 999];
    for (const code of codes) {
      const payload = buildVtpPayload({
        token: 'xxx',
        orderNumber: '12345',
        orderStatus: code
      });
      assert.equal(payload.DATA.ORDER_STATUS, code);
      assert.equal(payload.DATA.STATUS_NAME, VTP_STATUS_MAP[code]);
    }
  });
});

describe('sendWebhook network dispatch test', () => {
  let mockServer;
  let serverPort;
  let lastReceivedBody = null;

  before(async () => {
    mockServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        lastReceivedBody = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'OK', receivedAt: new Date().toISOString() }));
      });
    });

    await new Promise(resolve => {
      mockServer.listen(0, '127.0.0.1', () => {
        serverPort = mockServer.address().port;
        resolve();
      });
    });
  });

  after(() => {
    mockServer.close();
  });

  test('sendWebhook successfully dispatches POST request and parses response', async () => {
    const targetUrl = `http://127.0.0.1:${serverPort}/api/vtp-listener`;
    const payload = buildVtpPayload({
      token: 'my-token',
      orderNumber: 'VTP-999',
      orderStatus: 501
    });

    const result = await sendWebhook(targetUrl, payload);

    assert.equal(result.success, true);
    assert.equal(result.status, 200);
    assert.equal(result.body.status, 'OK');
    assert.deepEqual(lastReceivedBody, payload);
    assert.ok(result.durationMs >= 0);
  });

  test('sendWebhook handles unreachable target URL gracefully', async () => {
    const unreachableUrl = 'http://127.0.0.1:1'; // Closed port
    const result = await sendWebhook(unreachableUrl, { test: 1 });

    assert.equal(result.success, false);
    assert.equal(result.status, 0);
    assert.ok(result.error);
  });
});
