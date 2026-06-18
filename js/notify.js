// Emails a booking notification to the clinic via Web3Forms.
// To enable: get an access key from https://web3forms.com and paste it below.
// Until then, email is skipped and the booking still saves to the dashboard.

const WEB3FORMS_KEY = '1c5e31d7-fb70-41fc-b224-904100777e48';
const ENDPOINT      = 'https://api.web3forms.com/submit';

export function isEmailConfigured() {
  return Boolean(WEB3FORMS_KEY) && WEB3FORMS_KEY !== 'YOUR_ACCESS_KEY_HERE';
}

// Sends the full booking to the clinic inbox. Throws on failure.
export async function sendBookingEmail(booking) {
  if (!isEmailConfigured()) return null;

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
