import { expect, it } from 'vitest';
import { resolveReviewCaptureMode } from './review-capture-mode';

it('detects iPhone and desktop-like iPad while respecting explicit overrides', () => {
  const iphone = {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) Version/27.2 Mobile Safari/604.1',
    platform: 'iPhone',
    maxTouchPoints: 5,
  };
  const ipad = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/27.2 Safari/605.1.15',
    platform: 'MacIntel',
    maxTouchPoints: 5,
  };
  const desktop = { userAgent: 'Chrome Windows', platform: 'Win32', maxTouchPoints: 0 };
  const android = {
    userAgent: 'Mozilla Android Chrome Mobile',
    platform: 'Linux',
    maxTouchPoints: 5,
  };
  expect(resolveReviewCaptureMode(undefined, iphone)).toBe('compatible');
  expect(resolveReviewCaptureMode('auto', ipad)).toBe('compatible');
  expect(resolveReviewCaptureMode('auto', desktop)).toBe('hold');
  expect(resolveReviewCaptureMode('auto', android)).toBe('hold');
  expect(resolveReviewCaptureMode('hold', iphone)).toBe('hold');
  expect(resolveReviewCaptureMode('compatible', desktop)).toBe('compatible');
});
