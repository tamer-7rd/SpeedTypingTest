import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../audio.js', () => ({
  playErrorBeep: vi.fn(),
}));

import { markLetter, clearMark } from '../textRenderer.js';

describe('markLetter', () => {
  let letters;

  beforeEach(() => {
    document.body.innerHTML = '';
    const el = document.createElement('span');
    el.className = 'letter';
    el.dataset.ch = 'a';
    letters = [el];
    document.body.appendChild(el);
    
    // Add the start-typing element that markLetter function expects
    const startTypingEl = document.createElement('div');
    startTypingEl.className = 'start-typing';
    document.body.appendChild(startTypingEl);
  });

  it('marks correct letter', () => {
    const ok = markLetter(0, letters, 'a');
    expect(ok).toBe(true);
    expect(letters[0].classList.contains('correct-letter')).toBe(true);
  });

  it('marks wrong letter', () => {
    const ok = markLetter(0, letters, 'b');
    expect(ok).toBe(false);
    expect(letters[0].classList.contains('wrong-letter')).toBe(true);
  });

  it('clearMark removes styles', () => {
    letters[0].classList.add('correct-letter', 'wrong-letter', 'shake');
    clearMark(0, letters);
    expect(letters[0].classList.contains('correct-letter')).toBe(false);
    expect(letters[0].classList.contains('wrong-letter')).toBe(false);
    expect(letters[0].classList.contains('shake')).toBe(false);
  });
});
