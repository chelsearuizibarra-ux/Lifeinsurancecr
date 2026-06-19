const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzPCAxJYmvJsMFZ_o6WzdihrjdEz_7MnxQzhmMbmDK0yaDniJmIFbSoLYcxFe9dxzUy8g/exec';
const RENDER_URL = 'https://licr-web.onrender.com/lead';

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

// --- Show/hide children ages field + toggle required ---
document.querySelectorAll('input[name="has_children"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const field = document.getElementById('children_ages_field');
    const input = document.getElementById('children_ages_input');
    if (field) field.hidden = radio.value !== 'yes';
    if (input) input.required = radio.value === 'yes';
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

  return {
    // Contact
    hasSpouse:            fd.get('has_spouse') || 'no',
    email:                fd.get('email') || '',
    phone:                fd.get('phone') || '',
    state:                fd.get('client_state') || '',
    clientEmail:          fd.get('email') || '',
    spouseEmail:          fd.get('spouse_email') || '',

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
    appointmentPreference: fd.get('appointment_preference') || '',

    // SMS consent (two separate A2P-compliant checkboxes)
    smsConsentNonMarketing: form.querySelector('input[name="smsConsentNonMarketing"]')?.checked ? 'yes' : 'no',
    smsConsentMarketing:    form.querySelector('input[name="smsConsentMarketing"]')?.checked ? 'yes' : 'no',
    smsConsentTimestamp:    (form.querySelector('input[name="smsConsentNonMarketing"]')?.checked || form.querySelector('input[name="smsConsentMarketing"]')?.checked) ? new Date().toISOString() : '',

    // Meta
    source:               'lifeinsurancecr.com',
    formLocation:         form.dataset.form || 'unknown',
    submittedAt:          new Date().toISOString(),
  };
}

// --- Submit to Google Sheets via Apps Script ---
async function submitToSheets(payload) {
  await fetch(SHEETS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  // no-cors means we can't read the response, but data is sent
}

async function submitToRender(payload) {
  try {
    await fetch(RENDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Render notification failed (non-blocking):', err);
  }
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
    await Promise.all([submitToSheets(payload), submitToRender(payload)]);

    form.hidden = true;
    if (successEl) successEl.hidden = false;

    // Show success modal
    const modal = document.getElementById('success-modal');
    if (modal) modal.hidden = false;

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

// --- Success modal close ---
const modalCloseBtn = document.getElementById('modal-close-btn');
const successModal = document.getElementById('success-modal');

if (modalCloseBtn && successModal) {
  modalCloseBtn.addEventListener('click', () => { successModal.hidden = true; });
  successModal.addEventListener('click', e => {
    if (e.target === successModal) successModal.hidden = true;
  });
}

// === MULTI-STEP WIZARD ===
(function () {
  const wizardForm = document.querySelector('.wizard-form');
  if (!wizardForm) return;

  const backBtn = document.getElementById('wizard-back');
  const progressFill = document.getElementById('wizard-progress-fill');
  const stepLabel = document.getElementById('wizard-step-label');

  let hasSpouse = false;
  let currentIdx = 0;

  const stepRequiredFields = {
    1: ['mortgage_loan_amount', 'mortgage_term', 'mortgage_lender', 'mortgage_monthly_payment'],
    2: ['client_name', 'client_state'],
    3: ['client_dob', 'client_height', 'client_weight'],
    4: [],
    5: [],
    6: ['spouse_name', 'spouse_dob', 'spouse_height', 'spouse_weight'],
    7: [],
    8: ['client_medications'],
    9: ['client_occupation', 'client_schedule', 'beneficiary', 'appointment_preference'],
    10: ['email', 'phone'],
    11: [],
  };

  function getStepOrder() {
    const base = [1, 2, 3, 4, 5];
    if (hasSpouse) base.push(6);
    return base.concat([7, 8, 9, 10, 11]);
  }

  function getStepEl(num) {
    return wizardForm.querySelector('.wizard-step[data-step="' + num + '"]');
  }

  function goTo(idx, dir) {
    const order = getStepOrder();
    wizardForm.querySelectorAll('.wizard-step').forEach(function (s) {
      s.classList.remove('active', 'slide-back');
    });
    const target = getStepEl(order[idx]);
    if (!target) return;
    if (dir === 'back') target.classList.add('slide-back');
    target.classList.add('active');
    currentIdx = idx;
    updateUI(order);
    const section = document.getElementById('hero-form');
    if (section) window.scrollTo({ top: section.offsetTop - 80, behavior: 'smooth' });
  }

  function updateUI(order) {
    order = order || getStepOrder();
    const total = order.length;
    const num = currentIdx + 1;
    progressFill.style.width = Math.round((num / total) * 100) + '%';
    stepLabel.textContent = 'Step ' + num + ' of ' + total;
    backBtn.style.visibility = currentIdx === 0 ? 'hidden' : 'visible';
  }

  function validateStep(stepNum) {
    const required = stepRequiredFields[stepNum] || [];
    const stepEl = getStepEl(stepNum);
    if (!stepEl) return true;
    let valid = true;
    let firstBad = null;
    required.forEach(function (name) {
      const el = stepEl.querySelector('[name="' + name + '"]:not([type="hidden"])');
      if (!el) return;
      el.classList.remove('field-error');
      let empty = !el.value.trim();
      if (name === 'phone') {
        const raw = el.value.replace(/\D/g, '');
        empty = raw.length < 10;
      }
      if (empty) {
        el.classList.add('field-error');
        if (!firstBad) firstBad = el;
        valid = false;
      }
    });
    if (firstBad) firstBad.focus();
    return valid;
  }

  function next() {
    const order = getStepOrder();
    const stepNum = order[currentIdx];
    if (!validateStep(stepNum)) return;
    if (currentIdx < order.length - 1) goTo(currentIdx + 1, 'forward');
  }

  function back() {
    if (currentIdx > 0) goTo(currentIdx - 1, 'back');
  }

  // Wire up Next buttons
  wizardForm.querySelectorAll('.wizard-next-btn').forEach(function (btn) {
    btn.addEventListener('click', next);
  });

  // Back button
  if (backBtn) backBtn.addEventListener('click', back);

  // Choice buttons (auto-advance for big buttons, toggle for inline)
  wizardForm.querySelectorAll('.wizard-choice-btn[data-radio]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const radioName = btn.dataset.radio;
      const val = btn.dataset.value;

      // Update hidden radio inputs
      wizardForm.querySelectorAll('input[name="' + radioName + '"]').forEach(function (r) {
        r.checked = r.value === val;
      });

      if (radioName === 'has_spouse') {
        hasSpouse = val === 'yes';
        const spouseConditions = document.getElementById('spouse-conditions-wrap');
        const spouseMed = document.getElementById('spouse-med-field');
        if (spouseConditions) spouseConditions.hidden = !hasSpouse;
        if (spouseMed) spouseMed.hidden = !hasSpouse;
      }

      if (radioName === 'has_children') {
        const agesField = document.getElementById('children_ages_field');
        if (agesField) agesField.hidden = val !== 'yes';
        btn.closest('.wizard-inline-btns').querySelectorAll('.wizard-choice-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        return;
      }

      if (radioName === 'spouse_smoker') {
        btn.closest('.wizard-inline-btns').querySelectorAll('.wizard-choice-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        return;
      }

      // Big buttons auto-advance
      if (btn.closest('.wizard-big-btns')) {
        btn.classList.add('selected');
        setTimeout(next, 260);
      }
    });
  });

  // Condition toggle chips
  wizardForm.querySelectorAll('.condition-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const isSelected = btn.classList.toggle('selected');
      const fieldName = btn.dataset.field;
      const val = isSelected ? 'yes' : 'no';
      wizardForm.querySelectorAll('input[name="' + fieldName + '"]').forEach(function (r) {
        r.checked = r.value === val;
      });
    });
  });

  updateUI();
})();

/*
=== GOOGLE SHEETS SETUP INSTRUCTIONS ===

1. Go to sheets.google.com and create a new spreadsheet.
   Name the first sheet "Leads".

2. Go to Extensions → Apps Script.

3. Delete any existing code and paste this:

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');

    // Write headers on first submission
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(Object.keys(data));
    }

    sheet.appendRow(Object.values(data));

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

4. Click Deploy → New Deployment.
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click Deploy and copy the Web App URL.

5. Replace 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' at the top of this
   file with the URL you just copied.

6. Save and push to GitHub — your form will now write to Google Sheets.
*/
