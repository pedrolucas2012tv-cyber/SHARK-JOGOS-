export function initInputGuard({ onBlocked } = {}) {
  let announced = false;
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (announced) return;
    announced = true;
    onBlocked?.();
  });
}
