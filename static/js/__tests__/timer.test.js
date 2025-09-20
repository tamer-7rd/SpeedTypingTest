import { describe, it, expect, beforeEach } from 'vitest';

import { calculateResults } from '../timer.js';
import { stats } from '../typingTest.js';

describe('calculateResults', () => {
  beforeEach(() => {
    stats.correctCount = 0;
    stats.incorrectCount = 0;
    stats.typingTime = 0;
  });

  it('returns zeros when no input was made', () => {
    const res = calculateResults();
    expect(res).toEqual({ acc: 0, wpm: 0 });
  });

  it('calculates accuracy and wpm', () => {
    stats.correctCount = 100; // 100 correct chars
    stats.incorrectCount = 20;
    stats.typingTime = 30; // 30s
    const res = calculateResults();
    // acc = round(100 / (100+20) * 100) = round(83.33) = 83
    // wpm = round(((100/5) / 30) * 60) = round((20/30)*60) = round(40) = 40
    expect(res).toEqual({ acc: 83, wpm: 40 });
  });
});