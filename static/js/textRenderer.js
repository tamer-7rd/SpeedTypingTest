import {playErrorBeep} from "./audio.js";
import {normalizeChar } from "./typingTest.js";

// Removes visual marks from a letter element
export function clearMark(idx, letters) {
  const el = letters[idx];
  if (!el) return;
  el.classList.remove("correct-letter", "wrong-letter", "shake");
}

// Fetches random text paragraph from JSON file for typing test
export function randomTextSelector(){
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
export function makeText(words) {
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

// Positions the input field and caret at the specified letter index
// Calculates pixel positions based on target letter's bounding rectangle
export function placeInputAt(index, container, letters, input, caret) {
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
}

// Marks a letter as correct or incorrect based on user input
// Applies visual styling and plays error sound for incorrect input
export function markLetter(idx, letters, char) {
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
