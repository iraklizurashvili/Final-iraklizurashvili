// js/utils.js

/**
 * debounce — closure that delays `func` until the user stops
 * triggering it for `delay` ms. The private `timeoutId` variable
 * is captured in a closure — no external code can reset it.
 *
 * Real use here: search input on dashboard so the API filter
 * only fires ~300 ms after the user pauses typing.
 */
export function debounce(func, delay) {
  let timeoutId; // private — closed over by the returned function
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * createPriceCalculator — factory that wraps a private Set of
 * selected service IDs. Persists to localStorage automatically.
 *
 * Real use: price estimator on the prices page.
 *
 * @param {Array}  services    — array of {id, name, price} objects
 * @param {string} storageKey  — localStorage key for persistence
 */
export function createPriceCalculator(services, storageKey = 'selectedServices') {
  const saved    = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const selected = new Set(saved); // private — not exposed directly

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

/**
 * formatDate — converts an ISO or date string to a
 * human-readable Georgian format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr; // unparseable — show as-is
  return date.toLocaleDateString('ka-GE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

/**
 * showBanner — shows a temporary success/error message inside a
 * .form-banner element, then auto-hides it. Shared by the booking
 * and review forms so both behave identically.
 */
export function showBanner(el, msg, type, timeout = 6000) {
  if (!el) return;
  el.textContent = msg;
  el.className = `form-banner form-banner--${type}`;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, timeout);
}

/**
 * el — thin createElement wrapper used throughout the module.
 */
export function el(tag, className = '', html = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html)      node.innerHTML = html;
  return node;
}
