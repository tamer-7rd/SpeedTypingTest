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
    const randomText = await randomTextSelector();
    const words = randomText.trim().split(/\s+/);
    makeText(words);
    initTypingOverlay(".text-container");
  } catch (e) {
    console.error('The error is:', e)
  }
}














// Инпуты поверх (Вот тут остановился)

function initTypingOverlay(containerSelector = ".text-container") {
  const container = document.querySelector(containerSelector);
  if (!container) throw new Error("Container not found");

  const letters = Array.from(container.querySelectorAll(".letter"));
  // Блокируем клики по целевому тексту
  letters.forEach(el => el.classList.add("no-clicking"));

  // Создаём оверлей-инпут
  const input = document.createElement("input");
  input.className = "typing-overlay-input";
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", "false");
  container.appendChild(input);

  // --- Глобальные гаранты фокуса: всегда можно печатать ---
  function forceFocus() {
    if (document.activeElement !== input) {
      // preventScroll, чтобы страница не дёргалась при фокусе
      input.focus({ preventScroll: true });
    }
  }

  // Если фокус ушёл — вернём его сразу (следующий тик, чтобы не ломать клики)
  input.addEventListener("blur", () => setTimeout(forceFocus, 0));

  // Клик в пределах текстового контейнера — сразу возвращаем фокус в инпут
  container.addEventListener("mousedown", (e) => {
    e.preventDefault(); // не даём выделять текст
    forceFocus();
  });

  // Любой клик по документу: возвращаем фокус, КРОМЕ кликов по интерактивным полям
  document.addEventListener(
    "pointerdown",
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      // Не перехватываем клики по реальным инпутам/селектам/контент-эдитаблам/кнопкам/ссылкам
      if (t.closest("input, textarea, select, [contenteditable=true], .typing-overlay-input")) return;
      // Если нажали на кнопку/ссылку — не мешаем клику, просто вернём фокус после
      if (t.closest("button, a")) {
        setTimeout(forceFocus, 0);
        return;
      }
      // В остальных случаях — сразу фокусим наш скрытый инпут
      forceFocus();
    },
    { capture: true }
  );

  // Если окно вновь получило фокус (после переключения вкладок) — вернуть фокус в инпут
  window.addEventListener("focus", forceFocus);

  let i = 0; // текущий индекс буквы

  // Позиционируем инпут на букве i
  function placeInputAt(index) {
    if (index < 0) index = 0;
    if (index >= letters.length) index = letters.length - 1;

    const target = letters[index];
    const cr = container.getBoundingClientRect();
    const tr = target.getBoundingClientRect();

    const left = tr.left - cr.left + container.scrollLeft;
    const top = tr.top - cr.top + container.scrollTop;

    input.style.left = `${left}px`;
    input.style.top = `${top}px`;
    input.style.width = `${tr.width}px`;
    input.style.height = `${tr.height}px`;
  }

  // Сравнение и маркировка буквы
  function markLetter(idx, char) {
    const el = letters[idx];
    if (!el) return;

    // Что ожидаем
    let expected = el.dataset.ch ?? (el.classList.contains("space") ? " " : el.textContent);

    // Нормализация (убираем &nbsp; и т.п.)
    const normalize = s => (s === "\u00A0" || s === "" ? " " : s);

    // console.debug('idx', i, 'exp', JSON.stringify(expected), 'got', JSON.stringify(char));

    el.classList.remove("correct-letter", "wrong-letter");

    if (normalize(char) === normalize(expected)) {
      el.classList.add("correct-letter");
    } else {
      el.classList.add("wrong-letter");
    }
  }

  // Сбрасываем метку, когда откатываемся
  function unmarkLetter(idx) {
    const el = letters[idx];
    if (!el) return;
    el.classList.remove("correct-letter", "wrong-letter");
  }

  // Слушаем ввод
  input.addEventListener("input", () => {
    // Пользователь может вставить сразу несколько символов — берём последний
    const v = input.value;
    if (!v) return;
    const ch = v.slice(-1);
    // Сравниваем и двигаем индекс
    markLetter(i, ch);
    i = Math.min(i + 1, letters.length); // сдвиг
    input.value = "";                     // держим инпут пустым
    if (i < letters.length) placeInputAt(i);
  });

  // Backspace — шаг назад
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      // Если мы уже на первой, просто остаёмся
      if (i > 0) {
        i -= 1;
        unmarkLetter(i);
        placeInputAt(i);
      }
    }
  });

  // Фокус и начальная позиция
  input.focus();
  placeInputAt(i);

  // На всякий случай — если контейнер скроллят/ресайзят
  const ro = new ResizeObserver(() => placeInputAt(i));
  ro.observe(container);

  return { container, input, letters, get index() { return i; } };
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
