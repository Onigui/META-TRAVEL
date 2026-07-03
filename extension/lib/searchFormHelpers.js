/** Helpers compartilhados para formulário de busca (web + extensão) */

export function formatPlaceLabel(p) {
  return `${p.city}, ${p.country} (${p.airport})`;
}

export function setupPlaceDatalist(inputEl, datalistEl, places) {
  if (!inputEl || !datalistEl || !places?.length) return;

  datalistEl.innerHTML = places
    .map((p) => `<option value="${formatPlaceLabel(p)}">${p.city}, ${p.country}</option>`)
    .join('');

  inputEl.addEventListener('change', () => {
    const val = inputEl.value.trim();
    const match = places.find(
      (p) =>
        formatPlaceLabel(p).toLowerCase() === val.toLowerCase() ||
        p.city.toLowerCase() === val.toLowerCase() ||
        p.airport.toLowerCase() === val.toLowerCase()
    );
    if (match) {
      inputEl.dataset.city = match.city;
      inputEl.dataset.country = match.country;
      inputEl.dataset.airport = match.airport;
    }
  });
}

export function readPlaceFromInput(inputEl, { defaultCountry = '' } = {}) {
  const val = inputEl?.value?.trim() || '';
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
    originAirport: form.querySelector('#origin-airport')?.value?.trim().toUpperCase() || origin.airport,
    destinationCity: destination.city,
    destinationCountry: destination.country,
    destinationAirport: form.querySelector('#destination-airport')?.value?.trim().toUpperCase() || destination.airport,
    passengers: Number(fd.get('passengers') || form.querySelector('#passengers')?.value) || 1,
    guests: Number(fd.get('guests') || form.querySelector('#guests')?.value) || 2,
    nights: Number(fd.get('nights') || form.querySelector('#nights')?.value) || 5,
    departureDate: form.querySelector('#departure-date')?.value || '',
    returnDate: form.querySelector('#return-date')?.value || '',
  };
}
