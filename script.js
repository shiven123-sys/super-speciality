/* Clinic site interactivity: mobile nav, FAQs, appointment booking (WhatsApp deep link), and AI assistant widget. */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const on = (el, event, handler, opts) => {
    if (!el) return;
    el.addEventListener(event, handler, opts);
  };

  const escapeHtml = (str) =>
    String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -----------------------------
  // Mobile navigation
  // -----------------------------
  function initMobileNav() {
    const body = document.body;
    const toggleBtn = $('.nav-toggle');
    const nav = $('#primary-nav');
    if (!toggleBtn || !nav) return;

    const links = $$('a[href^="#"]', nav);

    const setOpen = (open) => {
      body.classList.toggle('nav-open', open);
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    on(toggleBtn, 'click', (e) => {
      e.preventDefault();
      const open = !body.classList.contains('nav-open');
      setOpen(open);
    });

    // Close when a nav link is clicked
    links.forEach((a) =>
      on(a, 'click', () => {
        setOpen(false);
      })
    );

    // Close on outside click (only if open)
    on(document, 'click', (e) => {
      if (!body.classList.contains('nav-open')) return;
      const target = e.target;
      if (!(target instanceof Node)) return;

      const clickedInsideNav = nav.contains(target);
      const clickedToggle = toggleBtn.contains(target);
      if (!clickedInsideNav && !clickedToggle) {
        setOpen(false);
      }
    });

    // Close on Escape
    on(document, 'keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!body.classList.contains('nav-open')) return;
      setOpen(false);
    });
  }

  // -----------------------------
  // FAQ accordion
  // -----------------------------
  function initFaq() {
    const items = $$('.faq-item');
    if (!items.length) return;

    const faqs = $$('.faq-q');
    if (!faqs.length) return;

    // Only one open at a time
    const setOpen = (btn, open) => {
      const icon = $('.faq-icon', btn);
      const content = btn.parentElement?.querySelector('.faq-a');
      if (!content) return;

      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      content.hidden = !open;
      if (icon) icon.textContent = open ? '−' : '+';
    };

    faqs.forEach((btn) => {
      // Ensure initial ARIA/state match hidden
      const content = btn.parentElement?.querySelector('.faq-a');
      if (!content) return;
      const icon = $('.faq-icon', btn);
      btn.setAttribute('aria-expanded', content.hidden ? 'false' : 'true');
      if (icon) icon.textContent = content.hidden ? '+' : '−';

      on(btn, 'click', () => {
        const content = btn.parentElement?.querySelector('.faq-a');
        if (!content) return;
        const currentlyOpen = !content.hidden;

        // Close others
        items.forEach((it) => {
          const otherBtn = $('.faq-q', it);
          const otherContent = $('.faq-a', it);
          if (!otherBtn || !otherContent) return;
          if (otherBtn !== btn) {
            setOpen(otherBtn, false);
          }
        });

        // Toggle this one
        setOpen(btn, !currentlyOpen);
      });
    });
  }

  // -----------------------------
  // Appointment form
  // -----------------------------
  function initAppointmentForm() {
    const form = $('#appointment-form');
    if (!form) return;

    const success = $('#form-success');

    const WAPP_NUMBER = '919850823550'; // includes country code, without +

    const fields = [
      'parentName',
      'childName',
      'childAge',
      'gender',
      'mobile',
      'email',
      'city',
      'preferredDate',
      'preferredTime',
      'reason',
      'problem',
    ];

    const getErrorEl = (id) => form.querySelector(`.error[data-for="${CSS.escape(id)}"]`);

    const validate = () => {
      let ok = true;
      fields.forEach((id) => {
        const el = form.querySelector(`#${CSS.escape(id)}`);
        const err = getErrorEl(id);
        if (!el || !err) return;

        // Clear
        err.textContent = '';
        el.style.borderColor = '';

        // Use built-in validity when present
        if (!el.checkValidity()) {
          ok = false;
          const message = el.validationMessage || 'Please check this field.';
          err.textContent = message;
          el.style.borderColor = 'rgba(180,35,24,.6)';
        }
      });
      return ok;
    };

    // Inline validation on blur/input
    fields.forEach((id) => {
      const el = form.querySelector(`#${CSS.escape(id)}`);
      const err = getErrorEl(id);
      if (!el || !err) return;

      on(el, 'blur', () => {
        err.textContent = '';
        el.style.borderColor = '';
        if (!el.checkValidity()) {
          err.textContent = el.validationMessage || 'Please check this field.';
          el.style.borderColor = 'rgba(180,35,24,.6)';
        }
      });

      on(el, 'input', () => {
        // Clear error while typing
        err.textContent = '';
        el.style.borderColor = '';
      });

      on(el, 'change', () => {
        err.textContent = '';
        el.style.borderColor = '';
      });
    });

    on(form, 'submit', (e) => {
      e.preventDefault();
      if (!validate()) {
        // Scroll to first error field
        const firstErr = form.querySelector('.error[data-for]')?.textContent?.length
          ? form.querySelector('.error[data-for]:not(:empty)')
          : form.querySelector('.error:not(:empty)');
        if (firstErr) {
          const key = firstErr.getAttribute('data-for');
          const input = key ? form.querySelector(`#${CSS.escape(key)}`) : null;
          input?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
          input?.focus?.();
        }
        return;
      }

      if (success) success.textContent = '';

      const values = Object.fromEntries(fields.map((id) => [id, form.querySelector(`#${CSS.escape(id)}`)?.value?.trim() || '']));

      const message = [
        'Hello Dr. Ashlesha Shimpi-Dighe,',
        '',
        'I would like to book an appointment.',
        `Parent Name: ${values.parentName}`,
        `Child Name: ${values.childName}`,
        `Child Age: ${values.childAge}`,
        `Gender: ${values.gender}`,
        `Mobile: ${values.mobile}`,
        `Email: ${values.email}`,
        `City: ${values.city}`,
        `Preferred Date: ${values.preferredDate}`,
        `Preferred Time: ${values.preferredTime}`,
        '',
        `Reason: ${values.reason}`,
        `Problem Details: ${values.problem}`,
        '',
        'Thank you.',
      ].join('\n');

      const text = encodeURIComponent(message);
      const url = `https://wa.me/${WAPP_NUMBER}?text=${text}`;

      if (success) {
        success.textContent = 'Request prepared. Opening WhatsApp…';
      }

      window.open(url, '_blank', 'noopener');
    });
  }

  // -----------------------------
  // AI chat widget (canned responses)
  // -----------------------------
  function initAIChat() {
    const windowEl = $('#ai-window');
    const body = document.body;
    const fab = $('#ai-fab');
    const openBtn = $('#open-ai');
    const closeBtn = $('#ai-close');
    const minimizeBtn = $('#ai-minimize');
    const bodyEl = $('#ai-body');
    const form = $('#ai-form');
    const input = $('#ai-text');
    const quickButtons = $$('.ai-quick .qr');

    if (!windowEl) return;

    const typingHtml = () => `
      <div class="msg bot">
        <div class="bubble" aria-label="Assistant is typing">
          <div class="typing-dots" aria-hidden="true">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    `;

    const addMessage = (text, role = 'bot') => {
      if (!bodyEl) return;
      const div = document.createElement('div');
      div.className = `msg ${role === 'user' ? 'user' : 'bot'}`;
      div.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
      bodyEl.appendChild(div);

      // Scroll to bottom
      bodyEl.scrollTop = bodyEl.scrollHeight;
    };

    const canned = (question) => {
      const q = question.toLowerCase();

      const timings = 'Consultation Hours: 6:30 PM – 8:30 PM.';
      const spec = 'Doctor’s specialization: Consultant Pediatric & Neonatal Surgeon.';
      const contact = 'Mobile/WhatsApp: +91 9850823550. Phone: 020-42899083. Alternate: +91 9762801248.';
      const book = 'To book an appointment, use the Appointment Booking form on this page. After submission, it prepares a WhatsApp request for fast availability review.';

      if (q.includes('timing') || q.includes('hour') || q.includes('clinic timings') || q.includes('6:30') || q.includes('8:30')) return timings;
      if (q.includes('special') || q.includes('doctor') || q.includes('mch') || q.includes('pediatric') || q.includes('neonatal')) return spec;
      if (q.includes('book') || q.includes('appointment') || q.includes('whatsapp request') || q.includes('form')) return book;
      if (q.includes('contact') || q.includes('phone') || q.includes('mobile') || q.includes('whatsapp') || q.includes('number')) return contact;
      if (q.includes('location') || q.includes('address') || q.includes('where'))
        return 'Clinic location: SP Superspeciality Clinic, Khinvasara Trade Centre, 101, 1st Floor, Datta Mandir Road, Near Dange Chowk, Wakad, Pune – 411057.';

      return 'I can help with clinic timings, doctor specialization, location, contact numbers, and how to book an appointment.';
    };

    const setOpen = (open) => {
      if (open) windowEl.classList.add('open');
      else windowEl.classList.remove('open');
      // aria state
      windowEl.setAttribute('aria-hidden', open ? 'false' : 'true');
    };

    // open triggers
    on(fab, 'click', (e) => {
      e.preventDefault();
      setOpen(true);
      input?.focus?.();
    });
    on(openBtn, 'click', (e) => {
      e.preventDefault();
      setOpen(true);
      input?.focus?.();
    });

    on(closeBtn, 'click', (e) => {
      e.preventDefault();
      setOpen(false);
    });

    on(minimizeBtn, 'click', (e) => {
      e.preventDefault();
      setOpen(false);
    });

    // Quick replies
    const sendToAssistant = async (question) => {
      if (!bodyEl) return;
      const q = (question || '').trim();
      if (!q) return;

      addMessage(q, 'user');

      // typing dots
      bodyEl.insertAdjacentHTML('beforeend', typingHtml());
      bodyEl.scrollTop = bodyEl.scrollHeight;

      const typingMs = prefersReducedMotion() ? 0 : 650;
      await new Promise((r) => setTimeout(r, typingMs));

      // remove typing dots message
      const typingMsg = bodyEl.querySelector('.typing-dots')?.closest('.msg');
      typingMsg?.remove();

      addMessage(canned(q), 'bot');
    };

    quickButtons.forEach((b) =>
      on(b, 'click', () => {
        const text = b.textContent.trim();
        sendToAssistant(text);
      })
    );

    // Submit input
    on(form, 'submit', (e) => {
      e.preventDefault();
      const q = input?.value?.trim();
      if (!q) return;
      input.value = '';
      sendToAssistant(q);
    });

    // Clicking outside shouldn't close chat (keeps UX stable); no-op.
    // Ensure open state matches CSS on load
    setOpen(windowEl.classList.contains('open'));
  }

  // -----------------------------
  // Init
  // -----------------------------
  const init = () => {
    initMobileNav();
    initFaq();
    initAppointmentForm();
    initAIChat();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

