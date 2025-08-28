"use strict";

const buttons = document.querySelectorAll('.button');


function countdown(btn) {
  let time = btn.querySelector('.seconds').textContent;
  let value = (time === '3') ? 180 : +time;
  btn.classList.add('no-clicking')
  const timer = setInterval(() => {
    btn.querySelector('small').textContent = 'seconds';
    if (value <= 0) {
      clearInterval(timer);
    }
    btn.querySelector('.seconds').textContent = value--;
  }, 1000)
}

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


function makeText(words) {
  const container = document.querySelector('.text-container');
  if (!container) {
    console.error("Container is not found");
    return;
  }
  container.innerHTML = '';
  container.classList.add('container-padding', 'cutive-mono-regular');

  words.forEach(word => {
    const wordEl = document.createElement('span');
    wordEl.className = 'word';

    for (const ch of word) {
      const letterEl = document.createElement('span');
      letterEl.className = 'letter';
      letterEl.textContent = ch;
      letterEl.dataset.ch = ch;   // <- сохраняем ожидаемый символ
      wordEl.appendChild(letterEl);
    }

    const spaceEl = document.createElement('span');
    spaceEl.className = 'letter space';
    spaceEl.dataset.ch = ' ';     // <- ожидаемый пробел
    wordEl.appendChild(spaceEl);
    container.appendChild(wordEl);
  });
}


async function textShowing() {
  try {
    // Инициализируем аудио контекст при первом взаимодействии
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
    initTypingOverlay(".text-container");
  } catch (e) {
    console.error('The error is:', e)
  }
}




// --- Error sound (beep) ---
let _audioCtx = null;
let _lastBeepAt = 0;

function playErrorBeep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!_audioCtx) _audioCtx = new AC();
    if (_audioCtx.state === 'suspended') { _audioCtx.resume(); }
    const ctx = _audioCtx;
    const now = ctx.currentTime;
    // Throttle to avoid overlap
    if (now - _lastBeepAt < 0.05) return;
    _lastBeepAt = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now); // low "error" tone
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.7, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    // ignore audio errors (e.g., autoplay policies)
  }
}




function placeInputAt(index, container, letters, input, caret) {
  if (index >= letters.length) index = letters.length - 1;

  const target = letters[index];
  const cr = container.getBoundingClientRect();
  const tr = target.getBoundingClientRect();

  const left = tr.left - cr.left;
  const top = tr.top - cr.top;

  input.style.left = `${left}px`;
  input.style.top = `${top}px`;

  if (caret) {
    caret.style.left = `${left}px`;
    caret.style.top = `${top}px`;
    caret.style.height = `${tr.height}px`;
  }
}



function markLetter(idx, letters, char) {
  const el = letters[idx];
  if (!el) return false;

  // Что ожидаем
  let expected = el.dataset.ch;

  // Нормализация (убираем &nbsp; и т.п.)
  const normalize = s => {
    if (s === "\u00A0") return " "; 
    if (s === "") return null; 
    return s;
  };

  clearMark(idx, letters); 

  if (normalize(char) === normalize(expected) && normalize(char) !== null) {
    el.classList.add("correct-letter");
    return true;
  } else {
    el.classList.add("wrong-letter", "shake");
    playErrorBeep();
    const animationKiller = () => {
      el.classList.remove("shake");
      el.removeEventListener("animationend", animationKiller);
    };
    el.addEventListener("animationend", animationKiller);
    return false;
  }
}

function clearMark(idx, letters) {
  const el = letters[idx];
  if (!el) return;
  el.classList.remove("correct-letter", "wrong-letter", "shake");
}



function initTypingOverlay(containerSelector = ".text-container") {
  const container = document.querySelector(containerSelector);
  if (!container) throw new Error("Container not found");

  const letters = Array.from(container.querySelectorAll(".letter"));

  // Создаём оверлей-инпут
  const input = document.createElement("input");
  input.className = "typing-overlay-input";
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", "false");
  container.appendChild(input);

  // Кастомная физическая каретка (жёлтая) поверх overlay-инпута
  const caret = document.createElement("div");
  caret.className = "typing-caret"; 
  caret.setAttribute("aria-hidden", "true");
  caret.style.zIndex = "6"; 
  container.appendChild(caret);


  function forceFocus() {
    if (document.activeElement !== input) {
      // preventScroll, чтобы страница не дёргалась при фокусе
      input.focus({ preventScroll: true });
    }
  }

  input.addEventListener("blur", () => setTimeout(forceFocus, 0));
  window.addEventListener("focus", forceFocus);

  let i = 0; // текущий индекс буквы

  // Слушаем ввод
  input.addEventListener("input", () => {
    const char = input.value.slice(-1);
    if (!char) return;
    const isCorrect = markLetter(i, letters, char);
    if (isCorrect) {
      i++; 
      if (i < letters.length) {
        placeInputAt(i, container, letters, input, caret);
      }
    }
    input.value = ""; 
  });

  // Backspace — шаг назад
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const curr = letters[i];

      if (curr && curr.classList.contains("wrong-letter")) {
        clearMark(i, letters); 
        return;
      }
      if (i > 0) {
        i -= 1;
        clearMark(i, letters);
        placeInputAt(i, container, letters, input, caret);
      }
    }
  });

  // Нативный карет у текущей буквы
  input.focus();
  placeInputAt(i, container, letters, input, caret);
}













buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    buttons.forEach((other) => {
      if (other !== btn) {
        other.classList.add('fade-out');
      }
    });
    btn.classList.add('center-absolute');
    textShowing();
    countdown(btn);
  });
});
