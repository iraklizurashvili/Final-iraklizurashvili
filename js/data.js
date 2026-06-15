// js/data.js — shared service catalog
//
// Single source of truth for the clinic's services. Imported by both
// the price calculator (main.js) and the booking form (booking.js) so
// the two never drift out of sync.

export const SERVICES = [
  { id: 'caries',       name: 'კარიესი',                  price: 70,   category: 'therapy' },
  { id: 'treatment',    name: 'მკურნალობა',               price: 160,  category: 'therapy' },
  { id: 'cleaning',     name: 'სამეტაპიანი წმენდა',        price: 120,  category: 'therapy' },
  { id: 'whitening',    name: 'პროფ. გათეთრება',          price: 350,  category: 'whitening' },
  { id: 'extraction',   name: 'კბილის ამოღება',           price: 70,   category: 'surgery' },
  { id: 'wisdom',       name: 'მე-8 კბილის ამოღება',       price: 100,  category: 'surgery' },
  { id: 'resection',    name: 'მწვერვალის რეზექცია',       price: 250,  category: 'surgery' },
  { id: 'crown_mc',     name: 'მეტალოკერამიკის გვირგვინი', price: 180,  category: 'prosthetics' },
  { id: 'crown_zr',     name: 'ცირკონის გვირგვინი',        price: 300,  category: 'prosthetics' },
  { id: 'denture',      name: 'ფირფიტოვანი პროტეზი',       price: 400,  category: 'prosthetics' },
  { id: 'braces_metal', name: 'მეტალის ბრეკეტი',           price: 1000, category: 'ortho' },
  { id: 'braces_cer',   name: 'კერამიკის ბრეკეტი',          price: 2500, category: 'ortho' },
  { id: 'implant_sgs',       name: 'SGS იმპლანტი',         price: 800,  category: 'implant' },
  { id: 'implant_mis',       name: 'MIS იმპლანტი',         price: 1100, category: 'implant' },
  { id: 'implant_straumann', name: 'Straumann იმპლანტი',   price: 1600, category: 'implant' },
];
