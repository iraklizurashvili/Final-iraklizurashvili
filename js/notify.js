// js/notify.js — emails a booking notification to the clinic via Web3Forms.
//
// SETUP (one time, ~1 minute):
//   1. Go to https://web3forms.com
//   2. Enter your email (iraklizurashvili67@gmail.com) → you get an Access Key.
//   3. Paste that key into WEB3FORMS_KEY below.
//
// Until a real key is set, email sending is skipped silently and the booking
// still works (it's saved to the API / dashboard).

const WEB3FORMS_KEY = 'YOUR_ACCESS_KEY_HERE';
const ENDPOINT      = 'https://api.web3forms.com/submit';

export function isEmailConfigured() {
  return Boolean(WEB3FORMS_KEY) && WEB3FORMS_KEY !== 'YOUR_ACCESS_KEY_HERE';
}

/**
 * sendBookingEmail — sends the full booking (all fields) to your inbox.
 * Throws on failure so the caller can decide whether to surface it.
 */
export async function sendBookingEmail(booking) {
  if (!isEmailConfigured()) return null; // not set up yet — skip quietly

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject:   `🦷 ახალი ჯავშანი — ${booking.name}`,
      from_name: 'In Vera Dent ვებსაიტი',
      // fields shown in the email body:
      სახელი:    booking.name,
      ტელეფონი:  booking.phone,
      ელფოსტა:   booking.email || 'არ მითითებულა',
      სერვისი:   booking.service,
      თარიღი:    booking.date,
      დრო:       booking.time || '—',
      შენიშვნა:  booking.notes || '—',
    }),
  });

  if (!res.ok) throw new Error('ელ-ფოსტის გაგზავნა ვერ მოხერხდა');
  return res.json();
}
