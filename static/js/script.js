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
      const letterEl = document.createElement('span');
      letterEl.className = 'letter';
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






