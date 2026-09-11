
// Certification descriptions: two-second hover, keyboard focus, and native links.
(function () {
  const cards = document.querySelectorAll('#certifications .cert-badge');
  let activeCard = null;
  let activeTooltip = null;
  let hoveredCard = null;
  let keyboardCard = null;
  let showTimer = null;
  let hideTimer = null;
  let mode = 'pointer';
  let pointerX = 0;
  let pointerY = 0;

  function dismiss() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    if (activeTooltip) activeTooltip.hidden = true;
    activeCard = null;
    activeTooltip = null;
  }

  function positionTooltip() {
    if (!activeCard || !activeTooltip || activeTooltip.hidden) return;
    const margin = 12;
    const gap = 16;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const tooltipRect = activeTooltip.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    const anchorX = mode === 'pointer' ? pointerX : cardRect.left;
    const anchorY = mode === 'pointer' ? pointerY : cardRect.bottom;
    let left = anchorX + (mode === 'pointer' ? gap : 0);
    let top = anchorY + gap;

    if (left + tooltipRect.width > viewportWidth - margin) {
      left = mode === 'pointer'
        ? anchorX - tooltipRect.width - gap
        : viewportWidth - tooltipRect.width - margin;
    }
    if (top + tooltipRect.height > viewportHeight - margin) {
      top = (mode === 'pointer' ? pointerY : cardRect.top) - tooltipRect.height - gap;
    }
    activeTooltip.style.left = Math.max(margin, Math.min(left, viewportWidth - tooltipRect.width - margin)) + 'px';
    activeTooltip.style.top = Math.max(margin, Math.min(top, viewportHeight - tooltipRect.height - margin)) + 'px';
  }

  function start(card, nextMode, delay) {
    dismiss();
    activeCard = card;
    activeTooltip = document.getElementById(card.getAttribute('aria-describedby'));
    mode = nextMode;
    function show() {
      if (activeCard !== card || !activeTooltip) return;
      activeTooltip.hidden = false;
      positionTooltip();
    }
    if (delay) showTimer = setTimeout(show, delay);
    else show();
  }

  cards.forEach(function (card) {
    const tooltip = document.getElementById(card.getAttribute('aria-describedby'));
    if (!tooltip) return;

    card.addEventListener('pointerenter', function (event) {
      if (event.pointerType === 'touch') return;
      hoveredCard = card;
      pointerX = event.clientX;
      pointerY = event.clientY;
      start(card, 'pointer', 2000);
    });

    card.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (activeCard === card && mode === 'pointer') positionTooltip();
    });

    card.addEventListener('pointerleave', function () {
      hoveredCard = null;
      if (activeCard !== card) return;
      clearTimeout(showTimer);
      if (keyboardCard === card) {
        start(card, 'keyboard', 0);
      } else if (activeTooltip && !activeTooltip.hidden) {
        // Give the pointer time to cross the small gap into the description.
        hideTimer = setTimeout(dismiss, 150);
      } else {
        dismiss();
      }
    });

    card.addEventListener('focus', function () {
      if (!card.matches(':focus-visible')) return;
      keyboardCard = card;
      start(card, 'keyboard', 0);
    });

    card.addEventListener('blur', function () {
      if (keyboardCard === card) keyboardCard = null;
      if (activeCard !== card) return;
      if (hoveredCard === card) start(card, 'pointer', 2000);
      else dismiss();
    });

    // Native anchors handle mouse clicks, Enter, and touch without extra taps.
    card.addEventListener('pointerdown', dismiss);
    card.addEventListener('click', dismiss);
    tooltip.addEventListener('pointerenter', function () {
      clearTimeout(hideTimer);
    });
    tooltip.addEventListener('pointerleave', function () {
      if (hoveredCard !== activeCard && keyboardCard !== activeCard) dismiss();
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') dismiss();
  });

  function reset() {
    hoveredCard = null;
    keyboardCard = null;
    dismiss();
  }
  window.addEventListener('scroll', reset, { passive: true, capture: true });
  window.addEventListener('resize', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) reset();
  });
})();
