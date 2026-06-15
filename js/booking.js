// js/booking.js — online appointment booking form (contact.html)
//
// Handles the whole submission flow in JavaScript: client-side validation,
// a real POST to the external API, success/error feedback, and local
// persistence of every booking made on this device.

import { SERVICES } from './data.js';
import { createAppointment } from './api.js';
import { sendBookingEmail, isEmailConfigured } from './notify.js';
import { showBanner } from './utils.js';

const STORAGE_KEY = 'ivd_bookings';

/**
 * createSessionCounter — closure with a private `count` that no outside
 * code can read or reset directly. Used to show how many appointments the
 * visitor has booked during the current session.
 */
function createSessionCounter() {
  let count = 0; // private — lives only inside this closure
  return {
    increment() { return ++count; },
    get()       { return count; },
  };
}

export function initBooking() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const banner    = document.getElementById('bookingBanner');
  const counterEl = document.getElementById('bookingCount');
  const counter   = createSessionCounter();

  populateServiceOptions(document.getElementById('bookService'));
  lockPastDates(document.getElementById('bookDate'));

  form.addEventListener('submit', e => handleBookingSubmit(e, { form, banner, counterEl, counter }));
}

// Build the <option> list dynamically from the shared catalog.
function populateServiceOptions(select) {
  if (!select) return;
  SERVICES.forEach(svc => {
    const opt = document.createElement('option');
    opt.value       = svc.id;
    opt.textContent = `${svc.name} — ${svc.price} ₾`;
    select.appendChild(opt);
  });
}

// Stop users from picking a date in the past.
function lockPastDates(input) {
  if (input) input.min = new Date().toISOString().split('T')[0];
}

async function handleBookingSubmit(e, { form, banner, counterEl, counter }) {
  e.preventDefault();

  // Native HTML5 validation (required, type, minlength, pattern…)
  if (!form.checkValidity()) {
    form.reportValidity();
    showBanner(banner, '⚠️ გთხოვთ, შეავსოთ ყველა სავალდებულო ველი სწორად', 'error');
    return;
  }

  const data = readForm();

  const submitBtn = form.querySelector('[type="submit"]');
  const original  = submitBtn.textContent;
  submitBtn.disabled  = true;
  submitBtn.textContent = '⏳ იგზავნება…';

  // Full record — every field travels to the dashboard and the email.
  const appointment = {
    name:    data.name,
    phone:   data.phone,
    email:   data.email,
    service: serviceName(data.service),
    date:    data.date,
    time:    data.time,
    notes:   data.notes,
    status:  'pending',
  };

  // Two independent channels: save to the dashboard API and (if set up) email
  // the clinic. The booking counts as received if EITHER active channel
  // succeeds, so an outage in one (e.g. the throwaway MockAPI) never loses a
  // real lead.
  const emailActive = isEmailConfigured();
  const tasks = [createAppointment(appointment)];
  if (emailActive) tasks.push(sendBookingEmail(appointment));

  const [apiResult, emailResult] = await Promise.allSettled(tasks);

  const apiOk   = apiResult.status === 'fulfilled';
  const emailOk = emailActive && emailResult.status === 'fulfilled';

  if (apiOk) persistBooking({ ...appointment, id: apiResult.value?.id ?? Date.now() });
  if (apiResult.reason)   console.warn('dashboard save failed:', apiResult.reason.message);
  if (emailResult?.reason) console.warn('email failed:', emailResult.reason.message);

  submitBtn.disabled    = false;
  submitBtn.textContent = original;

  // No active channel succeeded → keep the user's input and let them retry.
  if (!apiOk && !emailOk) {
    showBanner(banner, '⚠️ გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან ან დაგვირეკეთ.', 'error');
    return;
  }

  const n = counter.increment();
  if (counterEl) {
    counterEl.textContent = `ამ სესიაში დაჯავშნილი ვიზიტები: ${n}`;
    counterEl.hidden = false;
  }
  form.reset();
  showBanner(banner, '✅ ჯავშანი მიღებულია! 1 სამუშაო დღეში დაგიკავშირდებით დასადასტურებლად. სასწრაფო შემთხვევაში დაგვირეკეთ: 599 93 26 16', 'success');
}

function readForm() {
  return {
    name:    document.getElementById('bookName').value.trim(),
    phone:   document.getElementById('bookPhone').value.trim(),
    email:   document.getElementById('bookEmail').value.trim(),
    date:    document.getElementById('bookDate').value,
    service: document.getElementById('bookService').value,
    time:    document.querySelector('input[name="bookTime"]:checked')?.value ?? '',
    notes:   document.getElementById('bookNotes').value.trim(),
  };
}

function serviceName(id) {
  return SERVICES.find(s => s.id === id)?.name ?? id;
}

// Application state persisted as an array of objects in localStorage.
function persistBooking(booking) {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  list.push(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
