/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
const timerDisplay = document.querySelector('#timer-heading');
const timerToggle = document.querySelector('#timer-toggle');
const timerReset = document.querySelector('#timer-reset');

let timeRemaining = 25 * 60;
let timerInterval = null;
const sessionDuration = 25 * 60;

function setToggleLabel(label, icon) {
  timerToggle.innerHTML = `<span aria-hidden="true">${icon}</span> ${label}`;
  timerToggle.setAttribute('aria-label', label);
}

/**
 * Updates the display of the timer
 */
function updateDisplay() {
  let minutes = Math.floor(timeRemaining / 60);
  let seconds = String(timeRemaining % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

/**
 * Descreases the time. Used in the startTimer function.
 */
function tick() {
  if(timeRemaining > 0) {
    timeRemaining--;
    updateDisplay();
  }

  if(timeRemaining === 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    setToggleLabel('Start focus', '▶');
  }
}

/**
 * Starts the timer. Uses setInterval to help tick descrease the timer.
 * @returns if the timerInterval is null.
 */
function startTimer() {
  if(timerInterval !== null) return;
  timerInterval = setInterval(tick, 1000);
  setToggleLabel('Pause focus', 'Ⅱ');
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  setToggleLabel('Resume focus', '▶');
}

function toggleTimer() {
  if (timerInterval === null) {
    startTimer();
  } else {
    pauseTimer();
  }
}

function resetTimer() {
  pauseTimer();
  timeRemaining = sessionDuration;
  updateDisplay();
  setToggleLabel('Start focus', '▶');
}

timerToggle.addEventListener('click', toggleTimer);
timerReset.addEventListener('click', resetTimer);

updateDisplay();
