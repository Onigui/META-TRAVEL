/** Helpers compartilhados para formulário de busca (web + extensão) */

import { resolvePlace } from './places.js';

export function formatPlaceDisplayTitle(p) {
  if (!p) return '';
  if (p.region) return `${p.city}, ${p.region}`;
  return `${p.city}, ${p.country}`;
}

export function formatPlaceLabel(p) {
  return formatPlaceDisplayTitle(p);
}

export function applyPlaceToInput(inputEl, place) {
  if (!inputEl || !place) return;
  inputEl.value = formatPlaceDisplayTitle(place);
  inputEl.dataset.city = place.city;
  inputEl.dataset.country = place.country;
  inputEl.dataset.airport = place.airport;
  inputEl.dataset.placeId = place.id || '';
}

export function readPlaceFromInput(inputEl, { defaultCountry = '' } = {}) {
  const val = inputEl?.value?.trim() || '';
  const resolved = resolvePlace({
    query: val,
    city: inputEl?.dataset?.city || val.split(',')[0]?.trim() || val,
    country: inputEl?.dataset?.country || val.split(',')[1]?.trim() || defaultCountry,
    airport: inputEl?.dataset?.airport || '',
  });

  if (resolved) {
    return {
      city: resolved.city,
      country: resolved.country,
      airport: resolved.airport,
      query: val,
      place: resolved,
    };
  }

  const city = inputEl?.dataset?.city || val.split(',')[0]?.trim() || val;
  const country = inputEl?.dataset?.country || val.split(',')[1]?.trim() || defaultCountry;
  const airport = inputEl?.dataset?.airport || '';
  return { city, country, airport, query: val };
}

export function getSearchParamsFromForm(form) {
  const fd = new FormData(form);
  const origin = readPlaceFromInput(form.querySelector('#origin-city'), { defaultCountry: 'Brasil' });
  const destination = readPlaceFromInput(form.querySelector('#destination-city'));

  return {
    originCity: origin.city,
    originCountry: origin.country || 'Brasil',
    originAirport: origin.airport,
    destinationCity: destination.city,
    destinationCountry: destination.country,
    destinationAirport: destination.airport,
    passengers: Number(fd.get('passengers') || form.querySelector('#passengers')?.value) || 1,
    guests: Number(fd.get('guests') || form.querySelector('#guests')?.value) || 2,
    nights: Number(fd.get('nights') || form.querySelector('#nights')?.value) || 5,
    departureDate: form.querySelector('#departure-date')?.value || '',
    returnDate: form.querySelector('#return-date')?.value || '',
  };
}

/** @deprecated Use initPlaceAutocompletes de placeAutocomplete.js */
export function setupPlaceDatalist(inputEl, datalistEl, places) {
  if (!inputEl || !places?.length) return;
  inputEl.addEventListener('change', () => {
    const val = inputEl.value.trim();
    const match = places.find(
      (p) =>
        formatPlaceDisplayTitle(p).toLowerCase() === val.toLowerCase() ||
        p.city.toLowerCase() === val.toLowerCase() ||
        (p.airportName || '').toLowerCase().includes(val.toLowerCase())
    );
    if (match) applyPlaceToInput(inputEl, match);
  });
}
