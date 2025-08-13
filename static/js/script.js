"use strict";

function countdown(btn) {
  let time;
  const value = btn.querySelector('b').textContent;
  time = (value === '3') ? 180 : +value;
  const timer = setInterval(() => {
    btn.querySelector('small').textContent = 'seconds';
    btn.querySelector('b').textContent = time <= 0 ? clearInterval(timer)
    : time--;
  }, 1000) ;
  btn.classList.add('no-clicking')
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


function makeDiv(words) {
  const container = document.querySelector('.text-container');
  if (!container) {
    console.error("Container is not found");
    return;
  }
  container.innerHTML = '';
  container.classList.add('container-padding', 'cutive-mono-regular');

  words.forEach(word => {
    const wordDiv = document.createElement('span');
    wordDiv.className = 'word';

    for (const ch of word) {
      const letterEl = document.createElement('letter');
      letterEl.textContent = ch;
      wordDiv.appendChild(letterEl);
    }

    container.appendChild(wordDiv);
  });
}


async function textShowing() {
  try {
    const randomText = await randomTextSelector();
    const words = randomText.trim().split(/\s+/);
    makeDiv(words);
  } catch (e) {
    console.error('The error is:', e)
  }
}










const buttons = document.querySelectorAll('.button');

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    buttons.forEach((other) => {
      if (other !== btn) {
        other.classList.add('fade-out');
      }
    });
    btn.classList.add('center-absolute');
    textShowing()
    countdown(btn);
  });
});