/** Autocomplete visual por cidade e nome do aeroporto (sem expor IATA ao usuário) */

import { searchPlaces } from './places.js';
import { formatPlaceDisplayTitle, applyPlaceToInput } from './searchFormHelpers.js';

export function setupPlaceAutocomplete(inputEl, { onSelect } = {}) {
  if (!inputEl || inputEl.dataset.autocompleteReady) return;
  inputEl.dataset.autocompleteReady = '1';
  inputEl.setAttribute('autocomplete', 'off');
  inputEl.setAttribute('role', 'combobox');
  inputEl.setAttribute('aria-autocomplete', 'list');
  inputEl.setAttribute('aria-expanded', 'false');

  const wrapper = document.createElement('div');
  wrapper.className = 'place-autocomplete';
  inputEl.parentNode.insertBefore(wrapper, inputEl);
  wrapper.appendChild(inputEl);

  const dropdown = document.createElement('div');
  dropdown.className = 'place-dropdown hidden';
  dropdown.setAttribute('role', 'listbox');
  wrapper.appendChild(dropdown);

  let results = [];
  let activeIndex = -1;

  function setExpanded(open) {
    inputEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function renderDropdown() {
    if (!results.length) {
      dropdown.classList.add('hidden');
      setExpanded(false);
      return;
    }

    dropdown.innerHTML = results
      .map(
        (p, i) => `
          <button type="button" class="place-option ${i === activeIndex ? 'active' : ''}" role="option" data-index="${i}">
            <span class="place-option-title">${formatPlaceDisplayTitle(p)}</span>
            <span class="place-option-sub">${p.airportName || ''}</span>
          </button>
        `
      )
      .join('');
    dropdown.classList.remove('hidden');
    setExpanded(true);

    dropdown.querySelectorAll('.place-option').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectIndex(Number(btn.dataset.index));
      });
    });
  }

  function refreshResults() {
    const q = inputEl.value.trim();
    results = searchPlaces(q, 8);
    activeIndex = results.length ? 0 : -1;
    renderDropdown();
  }

  function selectIndex(index) {
    const place = results[index];
    if (!place) return;
    applyPlaceToInput(inputEl, place);
    dropdown.classList.add('hidden');
    setExpanded(false);
    onSelect?.(place, inputEl);
  }

  inputEl.addEventListener('input', refreshResults);
  inputEl.addEventListener('focus', refreshResults);

  inputEl.addEventListener('keydown', (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, results.length - 1);
      renderDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      renderDropdown();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectIndex(activeIndex);
    } else if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
      setExpanded(false);
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.add('hidden');
      setExpanded(false);
    }
  });
}

export function initPlaceAutocompletes(form, { onSelect } = {}) {
  if (!form) return;
  const origin = form.querySelector('#origin-city');
  const destination = form.querySelector('#destination-city');
  if (origin) setupPlaceAutocomplete(origin, { onSelect });
  if (destination) setupPlaceAutocomplete(destination, { onSelect });
}
