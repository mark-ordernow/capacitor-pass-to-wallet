import assert from 'node:assert/strict';
import { test } from 'node:test';

import { googleBadgeKey } from '../dist/esm/button.js';
import { GOOGLE_BADGES } from '../dist/esm/generated/google-badges.js';

const add = Object.keys(GOOGLE_BADGES.add);
const view = Object.keys(GOOGLE_BADGES.view);

test('device language picks the matching official artwork', () => {
  assert.equal(googleBadgeKey(add, ['vi-VN']), 'vi');
  assert.equal(googleBadgeKey(add, ['en-GB']), 'en-gb');
  assert.equal(googleBadgeKey(add, ['zh-Hant-TW']), 'zh-tw');
  assert.equal(googleBadgeKey(add, ['pt_BR']), 'pt-br');
  assert.equal(googleBadgeKey(view, ['zh-Hans-CN']), 'zh-cn');
  assert.equal(googleBadgeKey(view, ['en-US']), 'en');
});

test('unsupported languages fall through to the next one, then English', () => {
  assert.equal(googleBadgeKey(add, ['ko-KR', 'ja-JP']), 'ja');
  assert.equal(googleBadgeKey(add, ['xx']), 'en');
  for (const keys of [add, view]) assert.ok(keys.includes('en'));
});

test('every language module has both variants', async () => {
  const { button, badge } = await GOOGLE_BADGES.view.vi();
  assert.match(button, /^<svg/);
  assert.match(badge, /^<svg/);
});
