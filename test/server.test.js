import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Integration test for server and public assets', () => {
  test('public/index.html exists and contains necessary elements', () => {
    const indexPath = path.join(__dirname, '..', 'public', 'index.html');
    assert.ok(fs.existsSync(indexPath), 'public/index.html must exist');

    const content = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(content.includes('id="targetUrl"'), 'Should contain targetUrl input');
    assert.ok(content.includes('id="vtpToken"'), 'Should contain vtpToken input');
    assert.ok(content.includes('id="orderNumber"'), 'Should contain orderNumber input');
    assert.ok(content.includes('data-code="200"'), 'Should have status 200');
    assert.ok(content.includes('data-code="500"'), 'Should have status 500');
    assert.ok(content.includes('data-code="501"'), 'Should have status 501');
    assert.ok(content.includes('data-code="506"'), 'Should have status 506');
    assert.ok(content.includes('data-code="999"'), 'Should have status 999');
  });

  test('vercel.json is valid JSON', () => {
    const vercelPath = path.join(__dirname, '..', 'vercel.json');
    assert.ok(fs.existsSync(vercelPath), 'vercel.json must exist');
    const parsed = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
    assert.ok(parsed.cleanUrls, 'Should specify cleanUrls');
  });
});
