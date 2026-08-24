let timer;

export function showToast(message, { tag = '' } = {}) {
  const toast = document.querySelector('[data-js="toast"]');
  if (!toast) return;
  toast.replaceChildren();
  const text = document.createElement('span');
  text.className = 'toast__text';
  text.textContent = message;
  toast.append(text);
  if (tag) {
    const badge = document.createElement('b');
    badge.className = 'toast__tag';
    badge.textContent = tag;
    toast.append(badge);
  }
  toast.classList.toggle('toast--plain', !tag);
  toast.classList.add('is-visible');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}
