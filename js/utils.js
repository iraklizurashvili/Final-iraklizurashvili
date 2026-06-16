// Shared helpers used across the app.

// Delays func until the user stops calling it for `delay` ms.
export function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Price estimator backing the prices page. Keeps the chosen service IDs in a
// private Set and mirrors them to localStorage so the selection survives reloads.
export function createPriceCalculator(services, storageKey = 'selectedServices') {
  const saved    = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const selected = new Set(saved);

  function save() {
    localStorage.setItem(storageKey, JSON.stringify([...selected]));
  }

  return {
    toggle(id)      { selected.has(id) ? selected.delete(id) : selected.add(id); save(); return this.getTotal(); },
    getTotal()      { return services.filter(s => selected.has(s.id)).reduce((acc, s) => acc + s.price, 0); },
    isSelected(id)  { return selected.has(id); },
    reset()         { selected.clear(); save(); },
  };
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr; // unparseable — show as-is
  return date.toLocaleDateString('ka-GE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Shows a temporary message in a .form-banner element, then auto-hides it.
export function showBanner(el, msg, type, timeout = 6000) {
  if (!el) return;
  el.textContent = msg;
  el.className = `form-banner form-banner--${type}`;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, timeout);
}

export function el(tag, className = '', html = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html)      node.innerHTML = html;
  return node;
}
