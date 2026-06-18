import { fetchAppointments } from './api.js';
import { debounce, createPriceCalculator, formatDate, el } from './utils.js';
import { initBooking } from './booking.js';
import { guardDashboard, initLogin, initLogout } from './auth.js';
import { SERVICES } from './data.js';

// Marks the page JS-capable so CSS can hide .reveal content until it animates in.
document.documentElement.classList.add('js');

if (document.getElementById('appointments-list')) guardDashboard();

const state = {
  appointments: [],
  filteredAppointments: [],
  searchQuery: '',
  currentFilter: 'all',
};

// Bookings are stored by service name but the dashboard filters by category.
const CATEGORY_BY_NAME = new Map(SERVICES.map(s => [s.name, s.category]));

// --- Navbar & mobile drawer ---
function initNavbar() {
  const navbar    = document.querySelector('.navbar');
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer    = document.querySelector('.nav-drawer');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('navbar--scrolled', window.scrollY > 20);
  });

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('nav-drawer--open');
      hamburger.classList.toggle('nav-hamburger--open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    drawer.querySelectorAll('a, button').forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('nav-drawer--open');
        hamburger.classList.remove('nav-hamburger--open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

// --- Scroll reveal ---
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('reveal--visible'); obs.unobserve(e.target); }
    }),
    { threshold: 0.1 }
  );
  els.forEach(e => obs.observe(e));
}

// --- Dashboard ---
async function initDashboard() {
  const list = document.getElementById('appointments-list');
  if (!list) return;

  const searchInput = document.getElementById('appointmentSearch');
  if (searchInput) {
    searchInput.value = localStorage.getItem('lastSearch') || '';
    state.searchQuery = searchInput.value.toLowerCase();

    const onSearch = debounce(e => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      localStorage.setItem('lastSearch', state.searchQuery);
      filterAndRender();
    }, 300);

    searchInput.addEventListener('input', onSearch);

    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        state.searchQuery = '';
        localStorage.removeItem('lastSearch');
        filterAndRender();
      }
    });
  }

  const filterSelect = document.getElementById('serviceFilter');
  if (filterSelect) {
    state.currentFilter = localStorage.getItem('lastFilter') || 'all';
    filterSelect.value  = state.currentFilter;
    filterSelect.addEventListener('change', e => {
      state.currentFilter = e.target.value;
      localStorage.setItem('lastFilter', state.currentFilter);
      filterAndRender();
    });
  }

  document.getElementById('refreshBtn')?.addEventListener('click', loadAppointments);

  await loadAppointments();
}

async function loadAppointments() {
  const spinner  = document.getElementById('loading-spinner');
  const errorDiv = document.getElementById('error-message');
  const list     = document.getElementById('appointments-list');

  if (spinner)  spinner.hidden  = false;
  if (list)     list.innerHTML  = '';
  if (errorDiv) errorDiv.hidden = true;

  try {
    const data = await fetchAppointments();
    state.appointments = data;
    filterAndRender();
  } catch (err) {
    if (errorDiv) {
      errorDiv.textContent = `⚠️ მონაცემების ჩატვირთვა ვერ მოხერხდა: ${err.message}`;
      errorDiv.hidden = false;
    }
  } finally {
    if (spinner) spinner.hidden = true;
  }
}

function filterAndRender() {
  const { appointments, searchQuery, currentFilter } = state;

  state.filteredAppointments = appointments.filter(a => {
    const matchQ = !searchQuery ||
      a.service?.toLowerCase().includes(searchQuery) ||
      a.name?.toLowerCase().includes(searchQuery);
    const matchF = currentFilter === 'all' || CATEGORY_BY_NAME.get(a.service) === currentFilter;
    return matchQ && matchF;
  });

  renderCards(state.filteredAppointments);
  updateStats();
}

function renderCards(list) {
  const container = document.getElementById('appointments-list');
  if (!container) return;
  container.innerHTML = '';

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = document.createElement('span');
    icon.className   = 'empty-state__icon';
    icon.textContent = '🦷';
    const msg = document.createElement('p');
    msg.textContent  = 'ვიზიტები ვერ მოიძებნა';
    const hint = document.createElement('p');
    hint.className   = 'empty-state__hint';
    hint.textContent = 'სცადეთ ფილტრის შეცვლა ან განაახლეთ გვერდი.';
    empty.append(icon, msg, hint);
    container.appendChild(empty);
    return;
  }

  list.forEach((appt, idx) => {
    const card = buildCard(appt, idx);
    const open = () => showModal(appt, card);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    container.appendChild(card);
  });
}

function buildCard(appt, idx) {
  const card = document.createElement('div');

  const statusKey = appt.status === 'completed' ? 'done'
    : appt.status === 'cancelled'              ? 'cancel'
    : 'pending';
  const statusClass = `appt-card__status--${statusKey}`;

  card.className = `appt-card appt-card--anim appt-card--${statusKey} reveal`;
  card.dataset.idx = idx;

  const service = document.createElement('span');
  service.className   = 'appt-card__service';
  service.textContent = appt.service || 'სერვისი';

  const name = document.createElement('span');
  name.className   = 'appt-card__name';
  name.textContent = appt.name || '—';

  const date = document.createElement('span');
  date.className   = 'appt-card__date';
  date.textContent = formatDate(appt.date);

  const badge = document.createElement('span');
  badge.className   = `appt-card__status ${statusClass}`;
  badge.textContent = appt.status || 'მოლოდინში';

  const body = document.createElement('div');
  body.className = 'appt-card__body';
  [service, name, date, badge].forEach(c => body.appendChild(c));

  card.appendChild(body);
  card.setAttribute('title', 'დეტალების სანახავად დააწექით');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  return card;
}

function updateStats() {
  const total     = document.getElementById('stat-total');
  const filtered  = document.getElementById('stat-filtered');
  const confirmed = document.getElementById('stat-confirmed');
  const pending   = document.getElementById('stat-pending');
  if (total)     total.textContent     = state.appointments.length;
  if (filtered)  filtered.textContent  = state.filteredAppointments.length;
  if (confirmed) confirmed.textContent = state.appointments.filter(a => a.status === 'completed').length;
  if (pending)   pending.textContent   = state.appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length;
}

function showModal(appt, trigger) {
  document.getElementById('apptModal')?.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'apptModal';
  overlay.className = 'modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'apptModalTitle');

  const card = document.createElement('div');
  card.className = 'modal__card';

  const closeBtn = document.createElement('button');
  closeBtn.className   = 'modal__close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'დახურვა');

  const icon  = el('div', 'modal__icon', '🦷');
  const title = el('h3', 'modal__title', appt.service || 'ვიზიტი');
  title.id = 'apptModalTitle';

  const dl = document.createElement('dl');
  dl.className = 'modal__details';

  const rows = [
    ['👤 პაციენტი', appt.name || '—'],
    ['📅 თარიღი',   formatDate(appt.date)],
    ['📊 სტატუსი',  appt.status || 'მოლოდინში'],
  ];
  if (appt.phone) rows.splice(1, 0, ['📞 ტელეფონი', appt.phone]);
  if (appt.email) rows.splice(appt.phone ? 2 : 1, 0, ['✉️ ელ-ფოსტა', appt.email]);
  if (appt.time)  rows.push(['⏰ დრო', appt.time === 'morning' ? 'დილა' : appt.time === 'afternoon' ? 'შუადღე' : appt.time]);
  if (appt.notes) rows.push(['📝 შენიშვნა', appt.notes]);

  rows.forEach(([dt, dd]) => {
    const dtEl = document.createElement('dt'); dtEl.textContent = dt;
    const ddEl = document.createElement('dd'); ddEl.textContent = dd;
    dl.appendChild(dtEl);
    dl.appendChild(ddEl);
  });

  [closeBtn, icon, title, dl].forEach(n => card.appendChild(n));
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    trigger?.focus();
  };

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);

  const onKey = e => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
  };
  document.addEventListener('keydown', onKey);
  closeBtn.focus();
}

// --- Price calculator ---
function initPriceCalculator() {
  const grid = document.getElementById('calcGrid');
  if (!grid) return;

  const calculator = createPriceCalculator(SERVICES);
  const totalEl    = document.getElementById('calcTotal');
  const resetBtn   = document.getElementById('calcReset');

  SERVICES.forEach(svc => {
    const label = document.createElement('label');
    label.className = 'calc-item';
    label.htmlFor   = `calc_${svc.id}`;

    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.id        = `calc_${svc.id}`;
    cb.className = 'calc-item__checkbox';
    cb.checked   = calculator.isSelected(svc.id);

    const text  = document.createElement('div');
    text.className = 'calc-item__text';

    const name  = document.createElement('span');
    name.className   = 'calc-item__name';
    name.textContent = svc.name;

    const price = document.createElement('span');
    price.className   = 'calc-item__price';
    price.textContent = svc.price.toLocaleString() + ' ₾';

    text.appendChild(name);
    text.appendChild(price);
    label.appendChild(cb);
    label.appendChild(text);

    if (calculator.isSelected(svc.id)) label.classList.add('calc-item--active');

    cb.addEventListener('change', () => {
      const total = calculator.toggle(svc.id);
      updateTotal(total);
      label.classList.toggle('calc-item--active', calculator.isSelected(svc.id));
    });

    grid.appendChild(label);
  });

  updateTotal(calculator.getTotal());

  resetBtn?.addEventListener('click', () => {
    calculator.reset();
    grid.querySelectorAll('.calc-item__checkbox').forEach(c => { c.checked = false; });
    grid.querySelectorAll('.calc-item').forEach(i => i.classList.remove('calc-item--active'));
    updateTotal(0);
  });

  function updateTotal(amount) {
    if (totalEl) totalEl.textContent = amount.toLocaleString() + ' ₾';
  }
}

// --- FAQ accordion ---
function initFaq() {
  document.querySelectorAll('.faq-item__q').forEach(q => {
    q.addEventListener('click', () => {
      const item   = q.closest('.faq-item');
      const isOpen = item.classList.contains('faq-item--open');
      document.querySelectorAll('.faq-item--open').forEach(i => {
        i.classList.remove('faq-item--open');
        i.querySelector('.faq-item__q')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('faq-item--open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// --- Service section pills (services.html) ---
function initServicePills() {
  const pills = document.querySelectorAll('.service-pill[href^="#"]');
  if (!pills.length) return;

  pills.forEach(pill => {
    pill.addEventListener('click', e => {
      e.preventDefault();
      pills.forEach(p => p.classList.remove('service-pill--active'));
      pill.classList.add('service-pill--active');
      document.querySelector(pill.getAttribute('href'))
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const ids = [...pills].map(p => p.getAttribute('href').slice(1));
  window.addEventListener('scroll', () => {
    let current = ids[0];
    ids.forEach(id => {
      const s = document.getElementById(id);
      if (s && window.scrollY >= s.offsetTop - 140) current = id;
    });
    pills.forEach(p =>
      p.classList.toggle('service-pill--active', p.getAttribute('href') === '#' + current)
    );
  }, { passive: true });
}

// --- Before/after smile slider ---
function initCompare() {
  const box = document.getElementById('smileCompare');
  if (!box) return;
  const range = box.querySelector('.compare__range');

  const setPos = v => {
    const p = Math.max(0, Math.min(100, v));
    box.style.setProperty('--pos', p + '%');
    range.value = p;
  };

  setPos(Number(range.value));
  range.addEventListener('input', e => setPos(Number(e.target.value)));

  // First time it scrolls into view, sweep the handle so users notice it drags.
  const peek = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      box.classList.add('compare--smooth');
      const frames = [50, 70, 30, 50];
      frames.forEach((p, i) => setTimeout(() => setPos(p), 400 + i * 300));
      setTimeout(() => box.classList.remove('compare--smooth'), 400 + frames.length * 300 + 350);
    });
  }, { threshold: 0.45 });
  peek.observe(box);
}

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initLogout();
  initNavbar();
  initScrollReveal();
  initDashboard();
  initFaq();
  initServicePills();
  initPriceCalculator();
  initBooking();
  initCompare();
  window.__ivdReady = true;
});
