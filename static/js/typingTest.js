"use strict";

import { countdown, calculateResults } from "./timer.js";
import { clearMark, placeInputAt, markLetter, randomTextSelector, makeText } from "./textRenderer.js";

// Get all test duration buttons
const buttons = document.querySelectorAll('.button');

// State object for tracking typing statistics
export const stats = {
  typingTime: 0,
  correctCount: 0,
  incorrectCount: 0,
}

let incorrectLetter = "";

// Audio context state objects for generating error sounds
export const soundStats = {
  _audioCtx: null,
  _lastBeepAt: 0,
}

// Global character normalization function
// Handles special cases like non-breaking spaces and empty strings
export function normalizeChar(char) {
  if (char === "\u00A0") return " "; // Convert non-breaking space to regular space
  if (char === "") return null;      // Return null for empty strings
  return char;
}

// Counts correct and incorrect characters for scoring
// Prevents double-counting of the same incorrect character
function scoreCounting (result, i, letters) {
  const letter = normalizeChar(letters[i]);
  if (result === true) {
    stats.correctCount++;
  } else if (result === false && incorrectLetter !== letter) {
    stats.incorrectCount++;
    incorrectLetter = letter;
  }
}

// Simple function to send results to Flask backend
// Creates URL parameters and redirects to results page
export function sendResultsToFlask(results, totalSeconds) {
  // Create URL with parameters
  const params = new URLSearchParams({
      wpm: results.wpm,
      accuracy: results.acc,
      time: totalSeconds +1,
      correctChars: stats.correctCount,
      incorrectChars: stats.incorrectCount
  });
  
  // Redirect to results page
  window.location.href = `/results?${params.toString()}`;
}


// Initializes the typing overlay system
// Creates invisible input field and custom caret for precise typing experience
export function initTypingOverlay(containerSelector = ".text-container", btn) {
  const container = document.querySelector(containerSelector);
  if (!container) throw new Error("Container not found");

  const letters = Array.from(container.querySelectorAll(".letter"));

  // Create invisible input field for capturing keystrokes
  const input = document.createElement("input");
  input.className = "typing-overlay-input";
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", "false");
  container.appendChild(input);

  // Custom physical caret (yellow) over overlay input
  const caret = document.createElement("div");
  caret.className = "typing-caret"; 
  caret.setAttribute("aria-hidden", "true");
  caret.style.zIndex = "6"; 
  container.appendChild(caret);

  // Forces focus on input field to ensure keystrokes are captured
  // Uses preventScroll to avoid page jumping on focus
  function forceFocus() {
    if (document.activeElement !== input) {
      // preventScroll to avoid page jumping on focus
      input.focus({ preventScroll: true });
    }
  }

  // Maintain focus on input field
  input.addEventListener("blur", () => setTimeout(forceFocus, 0));
  window.addEventListener("focus", forceFocus);

  let countdownLaunched = false;
  let i = 0; // current letter index

  // Listen for input - handle character input
  input.addEventListener("input", () => {
    const char = input.value.slice(-1);
    if (!char) return;
    if (countdownLaunched === false) {
      countdown(btn); // Start countdown on first keystroke
      countdownLaunched = true;
    }
    const isCorrect = markLetter(i, letters, char);
    if (isCorrect) {
      i++;
      scoreCounting(true, i-1, letters);
      if (i < letters.length) {
        placeInputAt(i, container, letters, input, caret); // Move to next letter
      } else {
        const results = calculateResults(stats.typingTime); // Test completed
        sendResultsToFlask(results, stats.typingTime);
      }
    } else if (!isCorrect) {
      scoreCounting(false, i, letters);
    }
    input.value = ""; // Clear input for next character
  });

  // Backspace — step back
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const curr = letters[i];

      // If current letter is marked wrong, just clear the mark
      if (curr && curr.classList.contains("wrong-letter")) {
        clearMark(i, letters); 
        return;
      }
      // Move back one position if possible
      if (i > 0) {
        i -= 1;
        clearMark(i, letters);
        placeInputAt(i, container, letters, input, caret);
      }
    }
  });

  // Native caret at current letter - initialize position and focus
  input.focus();
  placeInputAt(i, container, letters, input, caret);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Event listeners for test buttons
buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    // Hide other buttons with fade effect
    buttons.forEach((other) => {
      if (other !== btn) {
        other.classList.add('fade-out');
      }
    });
    btn.classList.add('center-absolute'); // Center the selected button
    textShowing(btn); // Start the typing test
  });
});

export async function textShowing(btn) {
  try {
    // Initialize audio context on first interaction (required for autoplay policies)
    if (!soundStats._audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      soundStats._audioCtx = new AC();
    }
    if (soundStats._audioCtx.state === 'suspended') {
      await soundStats._audioCtx.resume();
    }
    
    const randomText = await randomTextSelector();
    const words = randomText.trim().split(/\s+/);
    makeText(words);
    initTypingOverlay(".text-container", btn);
    
    // Scroll to text container once at the beginning
    setTimeout(() => {
      const container = document.querySelector('.text-container');
      if (container) {
        container.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  } catch (e) {
    console.error('The error is:', e)
  }
}






