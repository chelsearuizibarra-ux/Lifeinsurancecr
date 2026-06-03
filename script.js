const GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/Blj7F6WujktAsuRCp9oG/webhook-trigger/53b83a3e-ad8c-45d4-8056-443675be36c4';

// --- Navbar scroll effect ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// --- FAQ accordion ---
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
    btn.setAttribute('aria-expanded', String(!isOpen));
  });
});

// --- Phone formatting ---
function formatPhone(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 10);
  if (val.length >= 7) {
    val = `(${val.slice(0,3)}) ${val.slice(3,6)}-${val.slice(6)}`;
  } else if (val.length >= 4) {
    val = `(${val.slice(0,3)}) ${val.slice(3)}`;
  } else if (val.length >= 1) {
    val = `(${val}`;
  }
  input.value = val;
}

document.querySelectorAll('input[name="phone"]').forEach(el => {
  el.addEventListener('input', () => formatPhone(el));
});

// --- Age auto-calculation from date of birth ---
function calcAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : '';
}

const clientDob = document.getElementById('client_dob');
const clientAge = document.getElementById('client_age');
const spouseDob = document.getElementById('spouse_dob');
const spouseAge = document.getElementById('spouse_age');

if (clientDob && clientAge) {
  clientDob.addEventListener('change', () => {
    const age = calcAge(clientDob.value);
    if (age !== '') clientAge.value = age;
  });
}

if (spouseDob && spouseAge) {
  spouseDob.addEventListener('change', () => {
    const age = calcAge(spouseDob.value);
    if (age !== '') spouseAge.value = age;
  });
}

// --- Show/hide spouse fields ---
function applySpouseVisibility(hasSpouse) {
  const grids = document.querySelectorAll('.two-party-grid');
  const medTable = document.getElementById('medical-table');
  const spouseCols = document.querySelectorAll('.form-row .spouse-col');

  grids.forEach(g => g.classList.toggle('no-spouse', !hasSpouse));
  if (medTable) medTable.classList.toggle('no-spouse', !hasSpouse);
  spouseCols.forEach(el => el.classList.toggle('hidden', !hasSpouse));
}

document.querySelectorAll('input[name="has_spouse"]').forEach(radio => {
  radio.addEventListener('change', () => {
    applySpouseVisibility(radio.value === 'yes');
  });
});

// Initialize spouse visibility on load (default = No)
applySpouseVisibility(false);

// --- Show/hide children ages field ---
document.querySelectorAll('input[name="has_children"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const field = document.getElementById('children_ages_field');
    if (field) field.hidden = radio.value !== 'yes';
  });
});

// --- Build medical concerns list from Yes/No radios ---
function getMedicalConcerns(form, prefix) {
  const conditions = [];
  const map = {
    hbp: 'High Blood Pressure',
    heart_attack: 'Heart Attack',
    stroke: 'Stroke',
    cancer: 'Cancer',
    diabetes: 'Diabetes',
    cholesterol: 'High Cholesterol',
    dui: 'DUI/Substance Abuse',
    surgery: 'Surgeries or Diseases',
    accidents: 'Accidents (Past 10 Years)',
  };
  for (const [key, label] of Object.entries(map)) {
    const el = form.querySelector(`input[name="${prefix}_${key}"]:checked`);
    if (el && el.value === 'yes') conditions.push(label);
  }
  return conditions.join(', ') || 'None';
}

// --- Build GHL payload ---
function buildPayload(form) {
  const fd = new FormData(form);
  const smsEl = form.querySelector('.sms-checkbox');

  return {
    // Contact
    hasSpouse:            fd.get('has_spouse') || 'no',
    email:                fd.get('email') || '',
    phone:                fd.get('phone') || '',

    // Client general info
    clientName:           fd.get('client_name') || '',
    clientDOB:            fd.get('client_dob') || '',
    clientAge:            fd.get('client_age') || '',
    clientHeight:         fd.get('client_height') || '',
    clientWeight:         fd.get('client_weight') || '',
    clientSmoker:         fd.get('client_smoker') || 'no',

    // Spouse general info
    spouseName:           fd.get('spouse_name') || '',
    spouseDOB:            fd.get('spouse_dob') || '',
    spouseAge:            fd.get('spouse_age') || '',
    spouseHeight:         fd.get('spouse_height') || '',
    spouseWeight:         fd.get('spouse_weight') || '',
    spouseSmoker:         fd.get('spouse_smoker') || 'no',

    // Medical concerns
    clientMedicalConcerns: getMedicalConcerns(form, 'client'),
    spouseMedicalConcerns: getMedicalConcerns(form, 'spouse'),

    // Medications
    clientMedications:    fd.get('client_medications') || '',
    spouseMedications:    fd.get('spouse_medications') || '',

    // Mortgage
    mortgageLoanAmount:   fd.get('mortgage_loan_amount') || '',
    mortgageTerm:         fd.get('mortgage_term') || '',
    mortgageLender:       fd.get('mortgage_lender') || '',
    mortgageMonthlyPayment: fd.get('mortgage_monthly_payment') || '',

    // Miscellaneous
    clientOccupation:     fd.get('client_occupation') || '',
    clientSchedule:       fd.get('client_schedule') || '',
    spouseOccupation:     fd.get('spouse_occupation') || '',
    spouseSchedule:       fd.get('spouse_schedule') || '',
    beneficiary:          fd.get('beneficiary') || '',
    hasChildren:          fd.get('has_children') || 'no',
    childrenAges:         fd.get('children_ages') || '',
    appointmentDatetime:  fd.get('appointment_datetime') || '',

    // SMS consent
    smsConsent:           smsEl && smsEl.checked ? 'yes' : 'no',
    smsConsentTimestamp:  smsEl && smsEl.checked ? new Date().toISOString() : '',

    // Meta
    source:               'lifeinsurancecr.com',
    formLocation:         form.dataset.form || 'unknown',
    submittedAt:          new Date().toISOString(),
  };
}

// --- Submit to GHL webhook ---
async function submitToGHL(payload) {
  const response = await fetch(GHL_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Webhook responded with status ${response.status}`);
  return response;
}

// --- Handle form submission ---
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const submitBtn = form.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const card = form.closest('.intake-card, .hero-form-card, .cta-form-card');
  const successEl = card ? card.querySelector('.form-success') : null;

  // Phone validation
  const phoneEl = form.querySelector('input[name="phone"]');
  if (phoneEl) {
    const raw = phoneEl.value.replace(/\D/g, '');
    if (raw.length < 10) {
      phoneEl.setCustomValidity('Please enter a valid 10-digit phone number.');
      phoneEl.reportValidity();
      phoneEl.setCustomValidity('');
      return;
    }
  }

  // Loading state
  submitBtn.disabled = true;
  btnText.hidden = true;
  btnLoading.hidden = false;

  try {
    const payload = buildPayload(form);
    await submitToGHL(payload);

    form.hidden = true;
    if (successEl) successEl.hidden = false;

    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', { event_category: 'Lead', event_label: form.dataset.form });
    }
    if (typeof fbq === 'function') fbq('track', 'Lead');

  } catch (err) {
    console.error('Form submission error:', err);
    submitBtn.disabled = false;
    btnText.hidden = false;
    btnLoading.hidden = true;

    let errorEl = form.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'form-error';
      errorEl.style.cssText = 'color:#dc2626;font-size:13px;text-align:center;margin-top:8px;';
      submitBtn.insertAdjacentElement('afterend', errorEl);
    }
    errorEl.textContent = 'Something went wrong. Please try again.';
  }
}

// --- Wire up all forms ---
document.querySelectorAll('.intake-form, .lead-form').forEach(form => {
  form.addEventListener('submit', handleFormSubmit);
});

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// --- Hide sticky CTA when intake form is visible ---
const stickyCta = document.getElementById('sticky-cta');
const intakeSection = document.getElementById('hero-form');

if (stickyCta && intakeSection && window.IntersectionObserver) {
  const observer = new IntersectionObserver(([entry]) => {
    stickyCta.style.display = entry.isIntersecting ? 'none' : '';
  }, { threshold: 0.1 });
  observer.observe(intakeSection);
}
