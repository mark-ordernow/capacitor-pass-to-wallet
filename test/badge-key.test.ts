import { describe, expect, it } from 'vitest';

import { googleBadgeKey } from '../src/button';
import { GOOGLE_BADGES } from '../src/generated/google-badges';

const add = Object.keys(GOOGLE_BADGES.add);
const view = Object.keys(GOOGLE_BADGES.view);

describe('googleBadgeKey', () => {
  it('device language picks the matching official artwork', () => {
    expect(googleBadgeKey(add, ['vi-VN'])).toBe('vi');
    expect(googleBadgeKey(add, ['en-GB'])).toBe('en-gb');
    expect(googleBadgeKey(add, ['zh-Hant-TW'])).toBe('zh-tw');
    expect(googleBadgeKey(add, ['pt_BR'])).toBe('pt-br');
    expect(googleBadgeKey(view, ['zh-Hans-CN'])).toBe('zh-cn');
    expect(googleBadgeKey(view, ['en-US'])).toBe('en');
  });

  it('unsupported languages fall through to the next one, then English', () => {
    expect(googleBadgeKey(add, ['ko-KR', 'ja-JP'])).toBe('ja');
    expect(googleBadgeKey(add, ['xx'])).toBe('en');
    for (const keys of [add, view]) expect(keys).toContain('en');
  });

  it('every language module has both variants', async () => {
    const { button, badge } = await GOOGLE_BADGES.view.vi();
    expect(button).toMatch(/^<svg/);
    expect(badge).toMatch(/^<svg/);
  });
});
