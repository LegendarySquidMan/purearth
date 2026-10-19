(() => {
  'use strict';
  const printButton = document.querySelector('[data-print]');
  printButton.hidden = false;
  printButton.addEventListener('click', () => window.print());

  // Print every FAQ answer, then restore the reader's open/closed choices.
  const disclosureState = new Map();
  window.addEventListener('beforeprint', () => {
    for (const detail of document.querySelectorAll('.faq-list details')) {
      if (!disclosureState.has(detail)) disclosureState.set(detail, detail.open);
      detail.open = true;
    }
  });
  window.addEventListener('afterprint', () => {
    for (const [detail, open] of disclosureState) detail.open = open;
    disclosureState.clear();
  });

  const words = document.querySelector('[data-reading-body]').textContent.trim().split(/\s+/).length;
  document.querySelector('#reading-time').textContent = `${Math.ceil(words / 200)} min read`;
})();
