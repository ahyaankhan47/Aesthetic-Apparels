(function () {
  'use strict';
  const overlay = document.getElementById('inquiry-overlay');
  const dialog = document.getElementById('inquiry-dialog');
  const page = document.getElementById('site-content');
  const title = document.getElementById('inquiry-title');
  const closeButton = document.getElementById('inquiry-close');
  let previousFocus = null;
  let backdropPress = false;

  // hCaptcha may place its challenge outside the form. Keep that challenge
  // above the popup and available to keyboard users while the page is inert.
  function isCaptchaFrame(element) {
    if (!element || element.tagName !== 'IFRAME') return false;
    try {
      const host = new URL(element.src).hostname;
      return host === 'hcaptcha.com' || host.endsWith('.hcaptcha.com');
    } catch (_) { return false; }
  }

  function focusableElements() {
    const controls = [...dialog.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,iframe,[tabindex]')];
    document.querySelectorAll('iframe').forEach(frame => {
      if (!dialog.contains(frame) && isCaptchaFrame(frame)) controls.push(frame);
    });
    return controls.filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0);
  }

  function openInquiry(trigger) {
    if (!overlay.hidden) return;
    previousFocus = trigger || document.activeElement;
    overlay.hidden = false;
    document.documentElement.classList.add('inquiry-is-open');
    title.focus({ preventScroll: true });
    page.inert = true;
    page.setAttribute('aria-hidden', 'true');
  }

  function closeInquiry() {
    if (overlay.hidden) return;
    try {
      if (window.hcaptcha) { window.hcaptcha.reset(); const note = document.getElementById('captcha-status'); if (note) note.textContent = 'Complete a fresh verification before sending.'; }
    } catch (_) { /* The widget may still be loading on the first opening. */ }
    overlay.hidden = true;
    page.inert = false;
    page.removeAttribute('aria-hidden');
    document.documentElement.classList.remove('inquiry-is-open');
    if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') {
      previousFocus.focus({ preventScroll: true });
    }
  }

  document.querySelectorAll('[data-open-inquiry]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openInquiry(trigger);
    });
  });
  closeButton.addEventListener('click', closeInquiry);
  overlay.addEventListener('pointerdown', event => { backdropPress = event.target === overlay; });
  overlay.addEventListener('click', event => {
    if (event.target === overlay && backdropPress) closeInquiry();
    backdropPress = false;
  });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeInquiry();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = focusableElements();
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (!first) {
      event.preventDefault();
      title.focus({ preventScroll: true });
    } else if (event.shiftKey && (active === first || active === title || !controls.includes(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !controls.includes(active))) {
      event.preventDefault();
      first.focus();
    }
  });
  document.addEventListener('focusin', event => {
    if (!overlay.hidden && !dialog.contains(event.target) && !isCaptchaFrame(event.target)) {
      title.focus({ preventScroll: true });
    }
  });
  function openFromLink() {
    if (window.location.hash === '#contact' || window.location.hash === '#inquiry') openInquiry();
  }
  window.addEventListener('hashchange', openFromLink);
  openFromLink();
})();
