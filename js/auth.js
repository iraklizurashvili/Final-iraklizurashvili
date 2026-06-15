// js/auth.js — client-side admin gate for the dashboard.
//
// ⚠️  This is a "keep-out sign", NOT real security. The password below ships
//     to the browser, so a determined user can read it in DevTools or set the
//     session flag manually. It only stops ordinary visitors. Real protection
//     needs server-side auth.

const ADMIN_PASSWORD = 'invera2026';
const SESSION_KEY    = 'ivd_admin';

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

/**
 * guardDashboard — runs on dashboard.html. Sends visitors who haven't
 * logged in straight back to the login page.
 */
export function guardDashboard() {
  if (!isLoggedIn()) location.replace('login.html');
}

/**
 * initLogin — wires up the login form (login.html). If the visitor is
 * already authenticated this session, skip the form and go to the dashboard.
 */
export function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  if (isLoggedIn()) { location.replace('dashboard.html'); return; }

  const input = document.getElementById('password');
  const error = document.getElementById('loginError');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (input.value === ADMIN_PASSWORD) {
      // sessionStorage clears when the tab/browser closes → re-login each session.
      sessionStorage.setItem(SESSION_KEY, '1');
      location.replace('dashboard.html');
    } else {
      error.textContent = 'არასწორი პაროლი';
      input.classList.add('form-input--invalid');
      input.value = '';
      input.focus();
    }
  });

  // Clear the error state as soon as the user starts typing again.
  input?.addEventListener('input', () => {
    error.textContent = '';
    input.classList.remove('form-input--invalid');
  });
}

/**
 * initLogout — wires the dashboard's logout button to clear the session flag.
 */
export function initLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
  });
}
