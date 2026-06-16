// Network access to the external appointments API.

const MOCK_API = 'https://6a29a136f59cb8f65f1d6e62.mockapi.io';

// Get every appointment record. Throws on a bad response so callers can show
// an error message.
export async function fetchAppointments() {
  const res = await fetch(`${MOCK_API}/appointments`);
  if (!res.ok) throw new Error(`სერვერის შეცდომა (${res.status})`);
  return res.json();
}

// Send a new booking. Returns the created record (with its server id).
export async function createAppointment(appointment) {
  const res = await fetch(`${MOCK_API}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment),
  });
  if (!res.ok) throw new Error(`ჯავშნის გაგზავნა ვერ მოხერხდა (${res.status})`);
  return res.json();
}
