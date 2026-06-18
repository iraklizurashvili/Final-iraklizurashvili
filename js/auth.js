// The password ships to the browser, so this only keeps casual visitors out.
const ADMIN_PASSWORD = 'invera2026';
const SESSION_KEY    = 'ivd_admin';

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function guardDashboard() {
  if (!isLoggedIn()) location.replace('login.html');
}

export function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  if (isLoggedIn()) { location.replace('dashboard.html'); return; }

  const input = document.getElementById('password');
  const error = document.getElementById('loginError');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (input.value === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      location.replace('dashboard.html');
    } else {
      error.textContent = 'არასწორი პაროლი';
      input.classList.add('form-input--invalid');
      input.value = '';
      input.focus();
    }
  });

  input?.addEventListener('input', () => {
    error.textContent = '';
    input.classList.remove('form-input--invalid');
  });
}

export function initLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
  });
}
