import './index.css';

const timerDisplay = document.querySelector('#timer-heading');
const timerToggle = document.querySelector('#timer-toggle');
const timerReset = document.querySelector('#timer-reset');
const modeButtons = document.querySelectorAll('.mode-button');
const sessionLabel = document.querySelector('.session-label');
const timerCard = document.querySelector('.timer-card');
const timerControls = timerCard.querySelectorAll('button');
const progress = document.querySelector('#session-progress');
const todaySessions = document.querySelector('#today-sessions');
const todayFocusMinutes = document.querySelector('#today-focus-minutes');
const nextUp = document.querySelector('#next-up');
const todayDate = document.querySelector('#today-date');
const settingsDialog = document.querySelector('#settings-dialog');
const settingsForm = document.querySelector('#settings-form');
const settingsInputs = {
  focus: document.querySelector('#focus-duration'),
  shortBreak: document.querySelector('#short-break-duration'),
  longBreak: document.querySelector('#long-break-duration'),
  sessionsPerCycle: document.querySelector('#sessions-per-cycle'),
};

const settingsKey = 'seshd-settings';
const historyKey = 'seshd-focus-history';
const timerStateKey = 'seshd-timer-state';
const defaults = { focus: 25, shortBreak: 5, longBreak: 15, sessionsPerCycle: 4 };

function readStoredJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

let settings = { ...defaults, ...readStoredJson(settingsKey, {}) };
let activeMode = 'focus';
let currentSession = 1;
let timeRemaining = settings.focus * 60;
let timerInterval = null;
let isBreakEnforced = false;

function getDuration(mode) { return settings[mode] * 60; }

function saveTimerState() {
  localStorage.setItem(timerStateKey, JSON.stringify({ activeMode, currentSession, timeRemaining, isBreakEnforced }));
}

function updateDate() {
  todayDate.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function setBreakEnforcement(isEnforced) {
  isBreakEnforced = isEnforced;
  timerCard.classList.toggle('break-active', isEnforced);
  timerControls.forEach((button) => { button.disabled = isEnforced; });
}

function updateSessionLabel() {
  sessionLabel.textContent = `Session ${currentSession} of ${settings.sessionsPerCycle}`;
  progress.setAttribute('aria-label', `Session ${currentSession} of ${settings.sessionsPerCycle}`);
  progress.replaceChildren(...Array.from({ length: settings.sessionsPerCycle }, (_, index) => {
    const dot = document.createElement('span');
    dot.className = `progress-dot${index < currentSession - 1 ? ' complete' : ''}`;
    return dot;
  }));
}

function updateNextUp() {
  if (activeMode === 'focus') {
    const isLongBreak = currentSession === settings.sessionsPerCycle;
    nextUp.textContent = `${isLongBreak ? settings.longBreak : settings.shortBreak} minute ${isLongBreak ? 'long' : 'short'} break`;
  } else nextUp.textContent = `${settings.focus} minute focus session`;
}

function modeLabel() {
  return activeMode === 'shortBreak' ? 'short break' : activeMode === 'longBreak' ? 'long break' : 'focus';
}

function setToggleLabel(label, icon) {
  timerToggle.innerHTML = `<span aria-hidden="true">${icon}</span> ${label}`;
  timerToggle.setAttribute('aria-label', label);
}

function setStartLabel() { setToggleLabel(`Start ${modeLabel()}`, '▶'); }

function updateDisplay() {
  timerDisplay.textContent = `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`;
}

function updateDashboard() {
  const today = new Date().toDateString();
  const history = readStoredJson(historyKey, []).filter((entry) => entry.date === today);
  todaySessions.textContent = history.length;
  todayFocusMinutes.textContent = history.reduce((total, entry) => total + entry.minutes, 0);
}

function recordCompletedFocus() {
  const history = readStoredJson(historyKey, []);
  history.push({ date: new Date().toDateString(), minutes: settings.focus, completedAt: Date.now() });
  localStorage.setItem(historyKey, JSON.stringify(history.slice(-500)));
  updateDashboard();
}

function finishTimer() {
  if (activeMode === 'focus') {
    recordCompletedFocus();
    const breakMode = currentSession === settings.sessionsPerCycle ? 'longBreak' : 'shortBreak';
    setBreakEnforcement(true);
    selectMode(breakMode, true);
    startTimer();
  } else if (activeMode === 'shortBreak') {
    setBreakEnforcement(false);
    currentSession += 1;
    selectMode('focus');
  } else {
    setBreakEnforcement(false);
    currentSession = 1;
    selectMode('focus');
  }
}

function tick() {
  timeRemaining = Math.max(0, timeRemaining - 1);
  updateDisplay();
  saveTimerState();
  if (timeRemaining === 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    finishTimer();
  }
}

function startTimer() {
  if (timerInterval !== null) return;
  timerInterval = setInterval(tick, 1000);
  setToggleLabel(`Pause ${modeLabel()}`, 'Ⅱ');
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  setToggleLabel(`Resume ${modeLabel()}`, '▶');
  saveTimerState();
}

function selectMode(mode, keepBreakEnforcement = false) {
  pauseTimer();
  activeMode = mode;
  timeRemaining = getDuration(mode);
  if (!keepBreakEnforcement) setBreakEnforcement(false);
  updateDisplay();
  setStartLabel();
  updateSessionLabel();
  updateNextUp();
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === activeMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive);
  });
  saveTimerState();
}

function resetTimer() {
  pauseTimer();
  timeRemaining = getDuration(activeMode);
  updateDisplay();
  setStartLabel();
  saveTimerState();
}

function toggleTimer() { if (timerInterval === null) startTimer(); else pauseTimer(); }

function populateSettings() {
  settingsInputs.focus.value = settings.focus;
  settingsInputs.shortBreak.value = settings.shortBreak;
  settingsInputs.longBreak.value = settings.longBreak;
  settingsInputs.sessionsPerCycle.value = settings.sessionsPerCycle;
}

function openSettings() { populateSettings(); settingsDialog.showModal(); }

function saveSettings(event) {
  event.preventDefault();
  if (!settingsForm.reportValidity()) return;
  settings = {
    focus: Number(settingsInputs.focus.value),
    shortBreak: Number(settingsInputs.shortBreak.value),
    longBreak: Number(settingsInputs.longBreak.value),
    sessionsPerCycle: Number(settingsInputs.sessionsPerCycle.value),
  };
  if (currentSession > settings.sessionsPerCycle) currentSession = 1;
  localStorage.setItem(settingsKey, JSON.stringify(settings));
  selectMode(activeMode);
  settingsDialog.close();
}

function restoreTimerState() {
  const stored = readStoredJson(timerStateKey, null);
  if (!stored || !['focus', 'shortBreak', 'longBreak'].includes(stored.activeMode)) return;
  activeMode = stored.activeMode;
  currentSession = Math.min(Math.max(stored.currentSession || 1, 1), settings.sessionsPerCycle);
  timeRemaining = Math.min(Math.max(stored.timeRemaining || getDuration(activeMode), 0), getDuration(activeMode));
  setBreakEnforcement(Boolean(stored.isBreakEnforced));
}

timerToggle.addEventListener('click', toggleTimer);
timerReset.addEventListener('click', resetTimer);
modeButtons.forEach((button) => button.addEventListener('click', () => selectMode(button.dataset.mode)));
document.querySelector('#open-settings').addEventListener('click', openSettings);
document.querySelector('#open-timer-options').addEventListener('click', openSettings);
document.querySelector('#close-settings').addEventListener('click', () => settingsDialog.close());
document.querySelector('#restore-defaults').addEventListener('click', () => {
  settingsInputs.focus.value = defaults.focus;
  settingsInputs.shortBreak.value = defaults.shortBreak;
  settingsInputs.longBreak.value = defaults.longBreak;
  settingsInputs.sessionsPerCycle.value = defaults.sessionsPerCycle;
});
settingsForm.addEventListener('submit', saveSettings);

restoreTimerState();
updateDate();
updateDisplay();
updateSessionLabel();
updateNextUp();
updateDashboard();
setStartLabel();
modeButtons.forEach((button) => {
  const isActive = button.dataset.mode === activeMode;
  button.classList.toggle('active', isActive);
  button.setAttribute('aria-pressed', isActive);
});
