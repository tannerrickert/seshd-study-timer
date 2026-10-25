import './break.css';

const parameters = new URLSearchParams(window.location.search);
const endsAt = Number(parameters.get('endsAt'));
const type = parameters.get('type') === 'long' ? 'long break' : 'short break';
const countdown = document.querySelector('#break-countdown');

document.querySelector('#break-title').textContent = `Enjoy your ${type}.`;

function updateCountdown() {
  const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  countdown.textContent = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;
}

updateCountdown();
window.setInterval(updateCountdown, 250);
