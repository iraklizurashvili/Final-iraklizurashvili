import { formatDate } from './utils.js';

const WEB3FORMS_KEY = '1c5e31d7-fb70-41fc-b224-904100777e48';
const ENDPOINT      = 'https://api.web3forms.com/submit';

const EMAILJS_ENDPOINT    = 'https://api.emailjs.com/api/v1.0/email/send';
const EMAILJS_SERVICE_ID  = 'service_5gslj4l';
const EMAILJS_TEMPLATE_ID = 'template_0k1082j';
const EMAILJS_PUBLIC_KEY  = 'cpYrvuM0aWVePP2wz';

const TIME_LABELS = {
  morning:   'დილა (10:00–14:00)',
  afternoon: 'შუადღე (14:00–18:00)',
};

export function isEmailConfigured() {
  return Boolean(WEB3FORMS_KEY) && WEB3FORMS_KEY !== 'YOUR_ACCESS_KEY_HERE';
}

export async function sendBookingEmail(booking) {
  if (!isEmailConfigured()) return null;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject:   `🦷 ახალი ჯავშანი — ${booking.name}`,
      from_name: 'In Vera Dent ვებსაიტი',
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

// Confirmation email to the patient at the address they entered (via EmailJS).
export async function sendCustomerConfirmation(booking) {
  if (!booking.email) return null;

  const res = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id:     EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: booking.email,
        name:     booking.name,
        service:  booking.service,
        date:     formatDate(booking.date),
        time:     TIME_LABELS[booking.time] || booking.time || '—',
        phone:    booking.phone || '—',
        notes:    booking.notes || '—',
      },
    }),
  });

  if (!res.ok) throw new Error('დადასტურების წერილი ვერ გაიგზავნა');
  return res.text();
}
