/* Basic consent mode: no Google script or analytics request until acceptance. */
(() => {
  'use strict';

  const measurementId = 'G-MRWXDVVYC1';
  const preferenceKey = 'purearth.privacy.v1';
  const noticeVersion = 1;
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const disableKey = `ga-disable-${measurementId}`;
  const banner = document.getElementById('privacy-banner');
  const dialog = document.getElementById('privacy-dialog');
  const announcement = document.getElementById('privacy-announcement');
  if (!banner || !dialog) return;

  window[disableKey] = true;
  let preference = null;
  let memoryOnly = false;
  let tagStarted = false;
  let expiryTimer;
  let dismissed = false;
  const isLocal = !/^https?:$/.test(location.protocol) || /^(localhost|127(?:\.\d+){3}|\[::1\])$/.test(location.hostname) || location.hostname.endsWith('.localhost');
  const excludedPage = ['about', 'articles', 'privacy', 'not-found'].includes(document.body.dataset.page) || Boolean(location.search);
  const canMeasure = !isLocal && !excludedPage;

  function readPreference() {
    let record;
    try {
      record = memoryOnly ? preference : JSON.parse(localStorage.getItem(preferenceKey));
    } catch {
      return memoryOnly ? preference : null;
    }
    const now = Date.now();
    if (!record) return null;
    if (record.version !== noticeVersion || !['granted', 'denied'].includes(record.analytics) || !Number.isFinite(record.chosenAt) || !Number.isFinite(record.expiresAt) || record.chosenAt > now + 60000 || record.expiresAt <= now || record.expiresAt > record.chosenAt + lifetime) {
      try { if (!memoryOnly) localStorage.removeItem(preferenceKey); } catch { /* Storage can be unavailable. */ }
      return null;
    }
    return record;
  }

  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map(item => item.split('=')[0].trim()).filter(name => /^purearth_ga(?:_|$)/.test(name));
    const segments = location.pathname.split('/').slice(0, -1);
    const paths = new Set(['/']);
    while (segments.length) {
      paths.add(segments.join('/') + '/');
      paths.add(segments.join('/') || '/');
      segments.pop();
    }
    for (const name of names) for (const cookiePath of paths) {
      const expired = `${name}=; Max-Age=0; path=${cookiePath}; SameSite=Lax`;
      document.cookie = expired;
      document.cookie = `${expired}; domain=${location.hostname}`;
      document.cookie = `${expired}; domain=.${location.hostname}`;
    }
  }

  function updateLabels() {
    let text = 'Analytics is off. You have not accepted optional analytics.';
    if (preference?.analytics === 'denied') text = 'Analytics is off. Your rejection is saved for this browser.';
    if (preference?.analytics === 'granted') {
      text = isLocal ? 'Your acceptance is saved. Collection is disabled in local previews.' : excludedPage ? 'Your acceptance is saved. This page is excluded from analytics.' : 'Analytics is accepted for this browser. You can reject it at any time.';
    }
    for (const label of document.querySelectorAll('[data-consent-status]')) label.textContent = text;
  }

  function startAnalytics() {
    if (!canMeasure || preference?.analytics !== 'granted' || tagStarted) return;
    tagStarted = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
    const file = document.body.dataset.analyticsPage;
    // The page name is generated from our own content, never from visitor input.
    const pageUrl = new URL(file, new URL('.', location.href)).href;
    window.gtag('consent', 'default', denied);
    window.gtag('set', { allow_google_signals: false, allow_ad_personalization_signals: false, page_location: pageUrl, page_referrer: '' });
    window.gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_location: pageUrl,
      page_referrer: '',
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_prefix: 'purearth',
      cookie_domain: location.hostname,
      cookie_path: new URL('.', location.href).pathname,
      cookie_expires: lifetime / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax' + (location.protocol === 'https:' ? ';Secure' : '')
    });
    const script = document.createElement('script');
    script.id = 'purearth-google-tag';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.referrerPolicy = 'no-referrer';
    script.onerror = () => { announcement.textContent = 'Your choice is saved. Analytics could not load; the website remains available.'; };
    document.head.append(script);
  }

  function stopAnalytics() {
    // Use the supported opt-out flag before unloading the active tag. Do not send a denial ping.
    window[disableKey] = true;
    clearAnalyticsCookies();
    if (tagStarted) {
      document.getElementById('purearth-google-tag')?.remove();
      location.reload();
    }
  }

  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    if (preference) expiryTimer = setTimeout(syncPreference, Math.min(Math.max(preference.expiresAt - Date.now(), 1), 2147483647));
  }

  function syncPreference() {
    preference = readPreference();
    banner.hidden = Boolean(preference) || dismissed;
    updateLabels();
    scheduleExpiry();
    if (preference?.analytics === 'granted') startAnalytics();
    else stopAnalytics();
  }

  function choose(analytics) {
    const now = Date.now();
    preference = { version: noticeVersion, analytics, chosenAt: now, expiresAt: now + lifetime };
    try { localStorage.setItem(preferenceKey, JSON.stringify(preference)); }
    catch { memoryOnly = true; }
    const wasDialogOpen = dialog.open;
    if (wasDialogOpen) dialog.close();
    banner.hidden = true;
    updateLabels();
    scheduleExpiry();
    announcement.textContent = analytics === 'granted' ? 'Your analytics choice has been saved.' : 'Analytics is off. Your choice has been saved.';
    if (!wasDialogOpen) document.querySelector('.site-footer [data-cookie-settings]')?.focus({ preventScroll: true });
    if (analytics === 'granted') startAnalytics();
    else stopAnalytics();
  }

  for (const button of document.querySelectorAll('[data-consent]')) button.addEventListener('click', () => choose(button.dataset.consent));
  for (const link of document.querySelectorAll('[data-cookie-settings]')) link.addEventListener('click', event => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    updateLabels();
    if (!dialog.open) dialog.showModal();
  });
  document.getElementById('privacy-close').addEventListener('click', () => dialog.close());
  document.getElementById('privacy-later').addEventListener('click', () => {
    dismissed = true;
    banner.hidden = true;
    announcement.textContent = 'Analytics stays off. You can decide later through Cookie settings.';
    document.querySelector('.site-footer [data-cookie-settings]')?.focus({ preventScroll: true });
  });
  window.addEventListener('storage', event => { if (event.key === preferenceKey || event.key === null) syncPreference(); });
  window.addEventListener('pageshow', syncPreference);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncPreference(); });
  syncPreference();
})();
