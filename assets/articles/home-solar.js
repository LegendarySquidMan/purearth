(() => {
  'use strict';
  const form = document.querySelector('#energy-form');
  const useInput = document.querySelector('#annual-use');
  const productionInput = document.querySelector('#annual-production');
  const result = document.querySelector('#energy-result');
  const percentageText = document.querySelector('#energy-percentage');
  const explanation = document.querySelector('#energy-explanation');
  const bar = document.querySelector('.energy-bar');
  const fill = document.querySelector('#energy-bar-fill');
  const overage = document.querySelector('#energy-overage');
  const error = document.querySelector('#energy-error');
  const pending = document.querySelector('#energy-pending');
  const format = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 1 });

  function hideResult() {
    result.hidden = true;
    bar.hidden = true;
    overage.hidden = true;
  }
  function compareEnergy(moveFocus = false) {
    const use = useInput.valueAsNumber;
    const production = productionInput.valueAsNumber;
    const invalidUse = !Number.isFinite(use) || use <= 0;
    const invalidProduction = !Number.isFinite(production) || production < 0;
    useInput.setAttribute('aria-invalid', String(invalidUse));
    productionInput.setAttribute('aria-invalid', String(invalidProduction));
    const percentage = production / use * 100;
    if (invalidUse || invalidProduction || !Number.isFinite(percentage)) {
      if (!invalidUse && !invalidProduction) productionInput.setAttribute('aria-invalid', 'true');
      hideResult();
      pending.hidden = true;
      error.textContent = invalidUse ? 'Enter annual household use greater than zero.' : invalidProduction ? 'Enter estimated solar production of zero or more.' : 'These figures cannot be compared. Check the annual kWh values and try again.';
      error.hidden = false;
      if (moveFocus) (invalidUse ? useInput : productionInput).focus();
      return;
    }
    error.hidden = true;
    pending.hidden = true;
    // This is an energy ratio only. It does not model self-consumption, exports or bill savings.
    const rounded = Math.round(percentage * 10) / 10;
    const display = percentage > 0 && rounded === 0 ? 'less than 0.1%' : `${format.format(percentage)}%`;
    percentageText.textContent = display;
    explanation.textContent = `Estimated annual solar production equals ${display} of annual household electricity use.`;
    fill.style.width = `${Math.min(100, percentage)}%`;
    result.hidden = false;
    bar.hidden = false;
    overage.hidden = percentage <= 100;
    overage.textContent = percentage > 100 ? 'The proposed annual production exceeds annual use. Ask how surplus would be handled, whether credits could be used, and whether the size fits the chosen connection arrangement. The bar stops at 100%; the number shows the full comparison.' : '';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    compareEnergy(true);
  });
  form.addEventListener('input', () => {
    hideResult();
    error.hidden = true;
    pending.hidden = false;
    useInput.removeAttribute('aria-invalid');
    productionInput.removeAttribute('aria-invalid');
  });
  form.addEventListener('reset', () => {
    // Reset events precede the browser's restoration of default input values.
    setTimeout(() => compareEnergy(), 0);
  });
  document.querySelector('#energy-static').hidden = true;
  form.hidden = false;
  compareEnergy();


  window.addEventListener('beforeprint', () => compareEnergy());
})();
