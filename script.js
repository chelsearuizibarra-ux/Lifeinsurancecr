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

// --- Age calculation helper ---
function calcAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// --- Build payload for GHL ---
function buildPayload(form) {
  const fd = new FormData(form);
  const tobacco = fd.get('tobacco') || fd.get('tobacco_b') || 'no';
  const dob = fd.get('dateOfBirth') || '';

  return {
    firstName:      fd.get('firstName') || '',
    lastName:       fd.get('lastName') || '',
    email:          fd.get('email') || '',
    phone:          fd.get('phone') || '',
    dateOfBirth:    dob,
    age:            calcAge(dob),
    gender:         fd.get('gender') || '',
    coverageAmount: fd.get('coverageAmount') || '',
    coverageType:   fd.get('coverageType') || '',
    tobaccoUser:    tobacco,
    directionsToHome: fd.get('directionsToHome') || '',
    source:         'lifeinsurancecr.com',
    formLocation:   form.dataset.form || 'unknown',
    submittedAt:    new Date().toISOString(),
  };
}

// --- Submit to GHL webhook ---
async function submitToGHL(payload) {
  const response = await fetch(GHL_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook responded with status ${response.status}`);
  }

  return response;
}

// --- Handle form submission ---
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const submitBtn = form.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const successEl = form.closest('.hero-form-card, .cta-form-card').querySelector('.form-success');

  // Basic validation
  const phone = form.querySelector('input[name="phone"]');
  const rawPhone = phone.value.replace(/\D/g, '');
  if (rawPhone.length < 10) {
    phone.setCustomValidity('Please enter a valid 10-digit phone number.');
    phone.reportValidity();
    phone.setCustomValidity('');
    return;
  }

  const dob = form.querySelector('input[name="dateOfBirth"]');
  const age = calcAge(dob.value);
  if (age < 18 || age > 85) {
    dob.setCustomValidity('Applicants must be between 18 and 85 years old.');
    dob.reportValidity();
    dob.setCustomValidity('');
    return;
  }

  // Loading state
  submitBtn.disabled = true;
  btnText.hidden = true;
  btnLoading.hidden = false;

  try {
    const payload = buildPayload(form);
    await submitToGHL(payload);

    // Show success
    form.hidden = true;
    if (successEl) successEl.hidden = false;

    // Track conversion event if analytics are present
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        event_category: 'Lead',
        event_label: form.dataset.form,
      });
    }
    if (typeof fbq === 'function') {
      fbq('track', 'Lead');
    }
  } catch (err) {
    console.error('Form submission error:', err);
    // Re-enable form on error
    submitBtn.disabled = false;
    btnText.hidden = false;
    btnLoading.hidden = true;

    // Show inline error
    let errorEl = form.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'form-error';
      errorEl.style.cssText = 'color:#dc2626;font-size:13px;text-align:center;margin-top:4px;';
      submitBtn.insertAdjacentElement('afterend', errorEl);
    }
    errorEl.textContent = 'Something went wrong. Please try again or call us directly.';
  }
}

// --- Wire up all forms ---
document.querySelectorAll('.lead-form').forEach(form => {
  form.addEventListener('submit', handleFormSubmit);
});

// --- Smooth scroll for CTA links ---
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// --- Hide sticky CTA when hero form is visible ---
const stickyCta = document.getElementById('sticky-cta');
const heroFormCard = document.getElementById('hero-form');

if (stickyCta && heroFormCard && window.IntersectionObserver) {
  const observer = new IntersectionObserver(([entry]) => {
    stickyCta.style.display = entry.isIntersecting ? 'none' : '';
  }, { threshold: 0.2 });
  observer.observe(heroFormCard);
}

// --- Set max date for date of birth (must be at least 18) ---
document.querySelectorAll('input[name="dateOfBirth"]').forEach(input => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 85, today.getMonth(), today.getDate());
  input.max = maxDate.toISOString().split('T')[0];
  input.min = minDate.toISOString().split('T')[0];
});
