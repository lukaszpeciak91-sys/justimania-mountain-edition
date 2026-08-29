import { MENU_LAYOUT, menuControlLayout } from './menuLayout.js';

let activeControls = null;

export function hideMenuControls() {
  if (activeControls) {
    const { start, back, startListener, backListener, resizeListener } = activeControls;
    start.removeEventListener('click', startListener);
    back.removeEventListener('click', backListener);
    window.removeEventListener('resize', resizeListener);
    activeControls = null;
  }
  const container = document.getElementById('menu-controls');
  if (container) container.hidden = true;
}

export function showMenuControls(onStart, onBack) {
  hideMenuControls();
  const container = document.getElementById('menu-controls');
  const start = document.getElementById('menu-start-button');
  const back = document.getElementById('menu-back-button');
  const canvas = document.querySelector('#game canvas');
  if (!container || !start || !back || !canvas) return;

  const positionControls = () => {
    const rect = canvas.getBoundingClientRect();
    const layout = menuControlLayout(390, 844);
    const place = (button, control, width, height) => {
      button.style.left = `${rect.left + control.x * rect.width / 390}px`;
      button.style.top = `${rect.top + control.y * rect.height / 844}px`;
      button.style.width = `${width * rect.width / 390}px`;
      button.style.height = `${height * rect.height / 844}px`;
    };
    place(start, layout.start, MENU_LAYOUT.startWidth, MENU_LAYOUT.startHeight);
    place(back, layout.back, MENU_LAYOUT.backWidth, MENU_LAYOUT.backHeight);
  };
  let activated = false;
  const activate = (callback) => {
    if (activated) return;
    activated = true;
    callback();
  };
  const startListener = () => activate(onStart);
  const backListener = () => activate(onBack);
  const resizeListener = () => positionControls();
  start.addEventListener('click', startListener);
  back.addEventListener('click', backListener);
  window.addEventListener('resize', resizeListener);
  activeControls = { start, back, startListener, backListener, resizeListener };
  positionControls();
  container.hidden = false;
}
