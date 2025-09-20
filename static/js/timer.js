import { sendResultsToFlask, stats } from "./typingTest.js";

// Handles countdown timer for typing test
// Updates button display and launches test when countdown reaches zero
export function countdown(btn) {
  let time = btn.querySelector('.seconds').textContent;
  let value = (time === '3') ? 180 : +time;
  btn.classList.add('no-clicking'); // Prevent multiple clicks during countdown
  const timer = setInterval(() => {
    btn.querySelector('small').textContent = 'seconds';
    btn.querySelector('.seconds').textContent = value - 1;
    if (value >= 1) stats.typingTime++; // Increment typing time only when countdown is 
    value -= 1;
    if (value <= 0) {
      clearInterval(timer);
      const results = calculateResults(stats.typingTime);
      setTimeout(() => sendResultsToFlask(results, stats.typingTime), 1); // Small delay to ensure UI updates
    }
    btn.querySelector('.seconds').textContent = value;
  }, 1000)
}

// Calculates WPM (Words Per Minute) and accuracy percentage
// Standard WPM calculation assumes average word length of 5 characters
export function calculateResults (totalSeconds) {
  let acc = 0;
  let wpm = 0;

  // Return zero results if no input was made
  if (stats.correctCount === 0 && stats.incorrectCount === 0) {
    return {acc, wpm};
  }
  
  // Calculate accuracy as percentage of correct characters
  acc = Math.round(stats.correctCount * 100 / (stats.correctCount + stats.incorrectCount));
  // Calculate WPM: (correct characters / 5) / time * 60
  wpm = Math.round(((stats.correctCount / 5) / totalSeconds) * 60);
  return {acc, wpm};
}