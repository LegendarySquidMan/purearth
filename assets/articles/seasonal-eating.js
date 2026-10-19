(() => {
  'use strict';
  const switcher = document.querySelector('.season-switcher');
  const tabList = switcher.querySelector('[role="tablist"]');
  const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
  const panels = Array.from(switcher.querySelectorAll('.season-panel'));
  let selectedSeason = switcher.dataset.defaultSeason;

  function selectSeason(season, focus = false) {
    selectedSeason = season;
    for (const tab of tabs) {
      const selected = tab.dataset.season === season;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    }
    for (const panel of panels) panel.hidden = panel.id !== `season-${season}`;
  }
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => selectSeason(tab.dataset.season));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectSeason(tabs[next].dataset.season, true);
    });
  }
  for (const panel of panels) {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', panel.id.replace('season-', 'tab-'));
    panel.tabIndex = 0;
  }
  tabList.hidden = false;
  selectSeason(selectedSeason);


  let seasonBeforePrint;
  window.addEventListener('beforeprint', () => {
    seasonBeforePrint = selectedSeason;
    for (const panel of panels) panel.hidden = false;
  });
  window.addEventListener('afterprint', () => {
    if (seasonBeforePrint) selectSeason(seasonBeforePrint);
  });
})();
