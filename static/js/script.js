"use strict";

// ============================================================================
// INITIALIZATION AND CONSTANTS
// ============================================================================

// Get all test duration buttons
const buttons = document.querySelectorAll('.button');

// Global variables for tracking typing statistics
let typingTime = 0;
let correctCount = 0;
let incorrectCount = 0;
let incorrectLetter = "";

// Audio context for generating error sounds
let _audioCtx = null;
let _lastBeepAt = 0;

// ============================================================================
// UTILITIES AND HELPERS
// ============================================================================

// Global character normalization function
// Handles special cases like non-breaking spaces and empty strings
function normalizeChar(char) {
  if (char === "\u00A0") return " "; // Convert non-breaking space to regular space
  if (char === "") return null;      // Return null for empty strings
  return char;
}

// Removes visual marks from a letter element
function clearMark(idx, letters) {
  const el = letters[idx];
  if (!el) return;
  el.classList.remove("correct-letter", "wrong-letter", "shake");
}

// ============================================================================
// DATA HANDLING
// ============================================================================

// Fetches random text paragraph from JSON file for typing test
function randomTextSelector(){
  return fetch('/static/assets/data.json')
  .then(response => response.json())
  .then(data => {
    const paragraphs = data.paragraphs;
    const randomIndex = Math.floor(Math.random() * paragraphs.length);
    const randomParagraph = paragraphs[randomIndex]
    return randomParagraph;
  })
  .catch(error => console.error('The error is:', error))
}

// Creates DOM elements for the text to be typed
// Renders each word and letter as separate span elements for individual styling
function makeText(words) {
  const container = document.querySelector('.text-container');
  if (!container) {
    console.error("Container is not found");
    return;
  }
  container.innerHTML = ''; // Clear container
  container.classList.add('container-padding', 'cutive-mono-regular');

  words.forEach((word, index) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'word';

    // Create individual letter elements for each character
    for (const ch of word) {
      const letterEl = document.createElement('span');
      letterEl.className = 'letter';
      letterEl.textContent = ch;
      letterEl.dataset.ch = ch;   // <- save expected character for comparison
      wordEl.appendChild(letterEl);
    }
    
    // Add space only if it's not the last word
    if (index < words.length - 1) {
      const spaceEl = document.createElement('span');
      spaceEl.className = 'letter space';
      spaceEl.dataset.ch = ' '; // Expected space character
      wordEl.appendChild(spaceEl);
    }
    container.appendChild(wordEl);
  });
}

// ============================================================================
// AUDIO SYSTEM
// ============================================================================

// Plays error sound when user types incorrect character
// Uses Web Audio API to generate a beep sound
function playErrorBeep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!_audioCtx) _audioCtx = new AC();
    if (_audioCtx.state === 'suspended') { _audioCtx.resume(); }
    const ctx = _audioCtx;
    const now = ctx.currentTime;
    // Throttle to avoid overlap - prevent multiple beeps too close together
    if (now - _lastBeepAt < 0.05) return;
    _lastBeepAt = now;

    // Create oscillator and gain nodes for sound generation
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now); // low "error" tone (220 Hz)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.7, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    // ignore audio errors (e.g., autoplay policies, unsupported browsers)
  }
}

// ============================================================================
// POSITIONING AND VISUALIZATION
// ============================================================================

// Positions the input field and caret at the specified letter index
// Calculates pixel positions based on target letter's bounding rectangle
function placeInputAt(index, container, letters, input, caret) {
  if (index >= letters.length) index = letters.length - 1; // Ensure index is within bounds

  const target = letters[index];
  const cr = container.getBoundingClientRect();
  const tr = target.getBoundingClientRect();

  // Calculate relative position within container
  const left = tr.left - cr.left;
  const top = tr.top - cr.top;

  // Position input field
  input.style.left = `${left}px`;
  input.style.top = `${top}px`;

  // Position caret if provided
  if (caret) {
    caret.style.left = `${left}px`;
    caret.style.top = `${top}px`;
    caret.style.height = `${tr.height}px`;
  }

//  Force scroll to the current letter
  if (target) {
    target.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    });
  }
}

// Marks a letter as correct or incorrect based on user input
// Applies visual styling and plays error sound for incorrect input
function markLetter(idx, letters, char) {
  const el = letters[idx];
  if (!el) return false;

  // Get expected character from data attribute
  let expected = el.dataset.ch;

  clearMark(idx, letters); // Clear any existing marks

  // Compare normalized characters
  if (normalizeChar(char) === normalizeChar(expected) && normalizeChar(char) !== null) {
    el.classList.add("correct-letter");
    return true;
  } else {
    el.classList.add("wrong-letter", "shake");
    playErrorBeep();
    // Remove shake animation when it completes
    const animationKiller = () => {
      el.classList.remove("shake");
      el.removeEventListener("animationend", animationKiller);
    };
    el.addEventListener("animationend", animationKiller);
    return false;
  }
}

// ============================================================================
// RESULTS CALCULATION
// ============================================================================

// Counts correct and incorrect characters for scoring
// Prevents double-counting of the same incorrect character
function scoreCounting (result, i, letters) {
  const letter = normalizeChar(letters[i]);
  if (result === true) {
    correctCount++;
  } else if (result === false && incorrectLetter !== letter) {
    incorrectCount++;
    incorrectLetter = letter; // Track last incorrect letter to avoid double-counting
  }
}

// Calculates WPM (Words Per Minute) and accuracy percentage
// Standard WPM calculation assumes average word length of 5 characters
function calculateResults (totalSeconds) {
  let acc = 0;
  let wpm = 0;

  // Return zero results if no input was made
  if (correctCount === 0 && incorrectCount === 0) {
    return {acc, wpm};
  }
  
  // Calculate accuracy as percentage of correct characters
  acc = Math.round(correctCount * 100 / (correctCount + incorrectCount));
  // Calculate WPM: (correct characters / 5) / time * 60
  wpm = Math.round(((correctCount / 5) / totalSeconds) * 60);
  return {acc, wpm};
}

// Simple function to send results to Flask backend
// Creates URL parameters and redirects to results page
function sendResultsToFlask(results, totalSeconds) {
  // Create URL with parameters
  const params = new URLSearchParams({
      wpm: results.wpm,
      accuracy: results.acc,
      time: totalSeconds,
      correctChars: correctCount,
      incorrectChars: incorrectCount
  });
  
  // Redirect to results page
  window.location.href = `/results?${params.toString()}`;
}

// ============================================================================
// TIMER SYSTEM
// ============================================================================

// Handles countdown timer for typing test
// Updates button display and launches test when countdown reaches zero
function countdown(btn) {
  let time = btn.querySelector('.seconds').textContent;
  // Set initial value: 179 seconds (3 minutes) if starting from 3, otherwise decrement
  let value = (time === '3') ? 179 : +time -1;
  btn.classList.add('no-clicking'); // Prevent multiple clicks during countdown
  const timer = setInterval(() => {
    btn.querySelector('small').textContent = 'seconds';
    if (value >= 1) typingTime++; // Increment typing time only when countdown is active
    if (value <= 0) {
      clearInterval(timer);
      const results = calculateResults(typingTime);
      setTimeout(() => sendResultsToFlask(results, typingTime), 1); // Small delay to ensure UI updates
    }
    btn.querySelector('.seconds').textContent = value--;
  }, 1000)
}

// ============================================================================
// MAIN TYPING TEST LOGIC
// ============================================================================

// Initializes the typing test interface
// Loads random text, renders it, and sets up the typing overlay
async function textShowing(btn) {
  try {
    // Initialize audio context on first interaction (required for autoplay policies)
    if (!_audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      _audioCtx = new AC();
    }
    if (_audioCtx.state === 'suspended') {
      await _audioCtx.resume();
    }
    
    const randomText = await randomTextSelector();
    const words = randomText.trim().split(/\s+/);
    makeText(words);
    initTypingOverlay(".text-container", btn);
  } catch (e) {
    console.error('The error is:', e)
  }
}

// Initializes the typing overlay system
// Creates invisible input field and custom caret for precise typing experience
function initTypingOverlay(containerSelector = ".text-container", btn) {
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
        const results = calculateResults(typingTime); // Test completed
        sendResultsToFlask(results, typingTime);
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






