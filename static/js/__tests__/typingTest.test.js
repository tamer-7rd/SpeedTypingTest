import { describe, it, expect, beforeEach } from 'vitest';

import { normalizeChar, sendResultsToFlask, stats } from '../typingTest.js';

describe('normalizeChar', () => {
  it('converts non-breaking space to regular space', () => {
    expect(normalizeChar('\u00A0')).toBe(' ');
  });

  it('returns null for empty string', () => {
    expect(normalizeChar('')).toBeNull();
  });

  it('returns the same character otherwise', () => {
    expect(normalizeChar('a')).toBe('a');
  });
});

describe('sendResultsToFlask', () => {
  beforeEach(() => {
    stats.correctCount = 10;
    stats.incorrectCount = 2;
  });

  it('builds correct URL with params and assigns window.location.href', () => {
    const original = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });

    const results = { wpm: 55, acc: 90 };
    sendResultsToFlask(results, 29); // totalSeconds

    expect(window.location.href).toContain('/results?');
    expect(window.location.href).toContain('wpm=55');
    expect(window.location.href).toContain('accuracy=90');
    expect(window.location.href).toContain('time=29'); // totalSeconds
    expect(window.location.href).toContain('correctChars=10');
    expect(window.location.href).toContain('incorrectChars=2');

    window.location = original;
  });
});
