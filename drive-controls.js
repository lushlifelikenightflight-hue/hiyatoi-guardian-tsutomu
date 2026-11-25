export function bindPedals(game, win, canDrive) {
 const buttons = [...game.querySelectorAll('[data-input]')];
 const held = new Map();

 function release(pointerId) {
  const button = held.get(pointerId);
  if (!button) return;
  held.delete(pointerId);
  button.dataset.held = String([...held.values()].includes(button));
  if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
 }

 for (const button of buttons) {
  button.addEventListener('pointerdown', event => {
   if (event.button !== 0 || event.ctrlKey || !canDrive()) return;
   event.preventDefault();
   held.set(event.pointerId, button);
   button.dataset.held = 'true';
   // The window listeners still release the pedal when capture is unavailable.
   try { button.setPointerCapture(event.pointerId); } catch {}
  });
  button.addEventListener('lostpointercapture', event => {
   if (held.get(event.pointerId) === button) release(event.pointerId);
  });
 }

 for (const type of ['pointerup', 'pointercancel']) {
  win.addEventListener(type, event => release(event.pointerId), true);
 }
 win.addEventListener('pointermove', event => {
  if (event.pointerType === 'mouse' && !(event.buttons & 1)) release(event.pointerId);
 }, true);

 game.addEventListener('contextmenu', event => {
  if (event.target.closest('button, summary, #scene')) event.preventDefault();
 });
 game.addEventListener('selectstart', event => {
  if (event.target.closest('button, summary, #scene')) event.preventDefault();
 });
 game.addEventListener('dragstart', event => {
  if (event.target.closest('button, summary, #scene')) event.preventDefault();
 });

 return {
  has(action) { return [...held.values()].some(button => button.dataset.input === action); },
  clear() { for (const pointerId of held.keys()) release(pointerId); }
 };
}
