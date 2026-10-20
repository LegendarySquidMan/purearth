(() => {
  'use strict';

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-nav');
  const setMenu = open => {
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header') && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  window.matchMedia('(min-width: 951px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  const directoryForm = document.querySelector('#directory-search');
  if (directoryForm) {
    const input = document.querySelector('#directory-query');
    const filters = Array.from(document.querySelectorAll('[data-filter]'));
    const cards = Array.from(document.querySelectorAll('#article-results .article-card'));
    const counter = document.querySelector('#results-count');
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get('category') || 'all';
    let category = filters.some(button => button.dataset.filter === requestedCategory) ? requestedCategory : 'all';
    input.value = (params.get('q') || '').slice(0, 120);

    function filterArticles(updateUrl = true) {
      const query = input.value.trim().toLocaleLowerCase('en-CA');
      const words = query.split(/\s+/).filter(Boolean);
      let visible = 0;
      for (const card of cards) {
        const matches = (category === 'all' || card.dataset.category === category) && words.every(word => card.dataset.search.includes(word));
        card.hidden = !matches;
        if (matches) {
          visible += 1;
        }
      }
      for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.filter === category));
      counter.textContent = `${visible} ${visible === 1 ? 'article' : 'articles'}${query ? ` matching “${input.value.trim()}”` : ''}${visible ? ' · ready to read' : ''}`;
      document.querySelector('#no-results').hidden = visible !== 0;
      if (updateUrl) {
        const url = new URL(window.location.href);
        query ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
        category === 'all' ? url.searchParams.delete('category') : url.searchParams.set('category', category);
        window.history.replaceState({}, '', url);
      }
    }

    directoryForm.addEventListener('submit', event => { event.preventDefault(); filterArticles(); });
    for (const button of filters) button.addEventListener('click', () => { category = button.dataset.filter; filterArticles(); });
    input.addEventListener('input', () => { if (!input.value) filterArticles(); });
    document.querySelector('#reset-search').addEventListener('click', () => { input.value = ''; category = 'all'; filterArticles(); input.focus(); });
    filterArticles(false);
  }

  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    const sendButton = document.querySelector('#contact-send-button');
    const status = document.querySelector('#contact-status');
    const fields = ['contact-name', 'contact-sender', 'contact-subject', 'contact-message'].map(id => document.getElementById(id));
    const showStatus = (message, isError = false) => {
      status.textContent = message;
      status.classList.toggle('is-error', isError);
      status.hidden = false;
    };
    const setHidden = (id, value) => {
      const field = document.getElementById(id);
      field.value = value;
      field.disabled = false;
    };
    const isHosted = /^https?:$/.test(window.location.protocol);
    if (isHosted) {
      // Use this deployment's full URL, so return links also work on GitHub project sites.
      const pageUrl = new URL('about.html', window.location.href);
      const returnUrl = new URL(pageUrl);
      returnUrl.searchParams.set('submitted', '1');
      returnUrl.hash = 'contact';
      setHidden('contact-page-url', pageUrl.href);
      setHidden('contact-return-url', returnUrl.href);
    }
    if (new URLSearchParams(window.location.search).get('submitted') === '1') {
      showStatus('Thank you. Your message has been submitted. We’ll reply using the email address you provided.');
    }
    for (const field of fields) field.addEventListener('input', () => field.setCustomValidity(''));
    contactForm.addEventListener('submit', event => {
      const [name, sender, subject, message] = fields;
      name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.');
      subject.setCustomValidity(subject.value.trim() ? '' : 'Please enter a subject.');
      message.setCustomValidity(message.value.trim().length >= 10 ? '' : 'Please enter a message of at least 10 characters.');
      if (!contactForm.reportValidity()) {
        event.preventDefault();
        return;
      }
      if (!isHosted) {
        event.preventDefault();
        showStatus('Please use the online website or the local HTTP preview to send this form. You can also email info@purearth.ca directly.', true);
        status.focus();
        return;
      }
      setHidden('contact-reply-to', sender.value.trim());
      contactForm.elements.namedItem('_subject').value = 'PUREARTH website: ' + subject.value.trim().replace(/[\r\n]+/g, ' ');
      sendButton.disabled = true;
      sendButton.textContent = 'Sending…';
      showStatus('Opening secure delivery. Please complete the spam check if requested.');
      // Leave the normal POST intact; FormSubmit handles delivery and spam verification.
    });
    window.addEventListener('pageshow', () => {
      sendButton.disabled = false;
      sendButton.textContent = 'Send message';
    });
  }
})();
