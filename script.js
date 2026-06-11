/**
 * ATMOSPHERE WEATHER APP — script.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  Replace the API_KEY below with your own key from https://openweathermap.org
 *     Free tier accounts work fine with the endpoints used here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_KEY  = '393ada9fa4dbe02866d7d3f6951bd04a'; // 🔑 Replace this
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// ── State ──────────────────────────────────────────────────────────────────

let currentUnit  = 'metric'; // 'metric' | 'imperial'
let lastCoords   = null;     // { lat, lon } — for refresh / unit toggle
let lastCity     = null;     // string — for refresh / unit toggle

// ── Element refs ──────────────────────────────────────────────────────────

const $loading      = document.getElementById('stateLoading');
const $loadingText  = document.getElementById('loadingText');
const $error        = document.getElementById('stateError');
const $errorText    = document.getElementById('errorText');
const $card         = document.getElementById('weatherCard');
const $searchForm   = document.getElementById('searchForm');
const $searchInput  = document.getElementById('searchInput');
const $unitToggle   = document.getElementById('unitToggle');
const $refreshBtn   = document.getElementById('refreshBtn');

// Card fields
const $cityName      = document.getElementById('cityName');
const $countryCode   = document.getElementById('countryCode');
const $temperature   = document.getElementById('temperature');
const $conditionIcon = document.getElementById('conditionIcon');
const $conditionText = document.getElementById('conditionText');
const $ambientIcon   = document.getElementById('ambientIcon');
const $feelsLike     = document.getElementById('feelsLike');
const $humidity      = document.getElementById('humidity');
const $windSpeed     = document.getElementById('windSpeed');
const $pressure      = document.getElementById('pressure');
const $visibility    = document.getElementById('visibility');
const $localTime     = document.getElementById('localTime');
const $lastUpdated   = document.getElementById('lastUpdated');

// ── Init ───────────────────────────────────────────────────────────────────

function init() {
  bindEvents();
  getCoordinates();
}

// ── Event Binding ──────────────────────────────────────────────────────────

function bindEvents() {
  $searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = $searchInput.value.trim();
    if (!city) return;
    lastCoords = null;
    lastCity   = city;
    getWeatherByCity(city);
    $searchInput.blur();
  });

  $unitToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.unit-btn');
    if (!btn) return;
    const newUnit = btn.dataset.unit;
    if (newUnit === currentUnit) return;
    currentUnit = newUnit;

    // Update button states
    $unitToggle.querySelectorAll('.unit-btn').forEach(b => {
      b.classList.toggle('unit-btn--active', b.dataset.unit === currentUnit);
      b.setAttribute('aria-pressed', String(b.dataset.unit === currentUnit));
    });

    // Re-fetch with new unit
    if (lastCoords) {
      getWeatherByCoords(lastCoords.lat, lastCoords.lon);
    } else if (lastCity) {
      getWeatherByCity(lastCity);
    }
  });

  $refreshBtn.addEventListener('click', () => {
    $refreshBtn.classList.add('spinning');
    if (lastCoords) {
      getWeatherByCoords(lastCoords.lat, lastCoords.lon).finally(() =>
        $refreshBtn.classList.remove('spinning'));
    } else if (lastCity) {
      getWeatherByCity(lastCity).finally(() =>
        $refreshBtn.classList.remove('spinning'));
    }
  });
}

// ── Geolocation ────────────────────────────────────────────────────────────

function getCoordinates() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.', true);
    return;
  }

  showLoading('Detecting your location…');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude: lat, longitude: lon } = position.coords;
      lastCoords = { lat, lon };
      lastCity   = null;
      getWeatherByCoords(lat, lon);
    },
    (err) => {
      let msg = 'Location access denied.';
      if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location unavailable.';
      if (err.code === err.TIMEOUT)              msg = 'Location request timed out.';
      showError(msg, true);
    },
    { timeout: 10000, maximumAge: 300000 }
  );
}

// ── API Calls ──────────────────────────────────────────────────────────────

async function getWeatherByCoords(lat, lon) {
  showLoading('Fetching weather data…');
  try {
    const url  = `${BASE_URL}?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`;
    const data = await fetchWeather(url);
    updateUI(data);
  } catch (err) {
    showError(err.message);
  }
}

async function getWeatherByCity(city) {
  showLoading(`Looking up "${city}"…`);
  try {
    const url  = `${BASE_URL}?q=${encodeURIComponent(city)}&units=${currentUnit}&appid=${API_KEY}`;
    const data = await fetchWeather(url);
    updateUI(data);
  } catch (err) {
    showError(err.message);
  }
}

async function fetchWeather(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Network error — check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid API key. Check your configuration.');
    if (response.status === 404) throw new Error('City not found. Please try another name.');
    if (response.status === 429) throw new Error('Too many requests. Please wait a moment.');
    throw new Error(`API error (${response.status}). Please try again.`);
  }

  return response.json();
}

// ── UI Update ──────────────────────────────────────────────────────────────

function updateUI(data) {
  // Extract values
  const city        = data.name;
  const country     = data.sys.country;
  const temp        = Math.round(data.main.temp);
  const feels       = Math.round(data.main.feels_like);
  const humidity    = data.main.humidity;
  const windSpeedRaw= data.wind.speed;
  const pressure    = data.main.pressure;
  const visMetres   = data.visibility;
  const iconCode    = data.weather[0].icon;
  const description = data.weather[0].description;
  const weatherId   = data.weather[0].id;
  const timezone    = data.timezone; // seconds offset from UTC
  const iconUrl     = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  // Unit-dependent labels
  const unitSymbol  = currentUnit === 'metric' ? '°C' : '°F';
  const speedLabel  = currentUnit === 'metric' ? 'm/s' : 'mph';
  const visMiles    = visMetres ? (visMetres / 1000).toFixed(1) + ' km' : 'N/A';

  // Populate fields
  $cityName.textContent      = city;
  $countryCode.textContent   = country;
  $temperature.textContent   = `${temp}${unitSymbol}`;
  $conditionText.textContent = description;
  $conditionIcon.src         = iconUrl;
  $conditionIcon.alt         = description;
  $ambientIcon.src           = iconUrl;
  $ambientIcon.alt           = '';
  $feelsLike.textContent     = `${feels}${unitSymbol}`;
  $humidity.textContent      = `${humidity}%`;
  $windSpeed.textContent     = `${windSpeedRaw} ${speedLabel}`;
  $pressure.textContent      = `${pressure} hPa`;
  $visibility.textContent    = visMiles;

  // Local time using the timezone offset
  const localDate = getLocalTime(timezone);
  $localTime.textContent = localDate;

  // Last updated
  $lastUpdated.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Set accent color based on weather condition
  applyAccentTheme(weatherId, iconCode);

  // Show card
  hideAll();
  $card.hidden = false;
}

// ── Accent Theming ─────────────────────────────────────────────────────────
// Maps OpenWeather condition groups to color palettes

function applyAccentTheme(weatherId, iconCode) {
  let accent, accentDim, accentGlow;

  // Night icons end in 'n'
  const isNight = iconCode && iconCode.endsWith('n');

  if (weatherId >= 200 && weatherId < 300) {
    // Thunderstorm → electric purple
    accent     = '#a855f7';
    accentDim  = 'rgba(168,85,247,0.12)';
    accentGlow = 'rgba(168,85,247,0.22)';
  } else if (weatherId >= 300 && weatherId < 600) {
    // Drizzle / Rain → steel blue
    accent     = '#60a5fa';
    accentDim  = 'rgba(96,165,250,0.12)';
    accentGlow = 'rgba(96,165,250,0.20)';
  } else if (weatherId >= 600 && weatherId < 700) {
    // Snow → icy cyan
    accent     = '#67e8f9';
    accentDim  = 'rgba(103,232,249,0.10)';
    accentGlow = 'rgba(103,232,249,0.18)';
  } else if (weatherId >= 700 && weatherId < 800) {
    // Atmosphere (fog/haze) → warm grey
    accent     = '#94a3b8';
    accentDim  = 'rgba(148,163,184,0.10)';
    accentGlow = 'rgba(148,163,184,0.15)';
  } else if (weatherId === 800) {
    // Clear sky
    if (isNight) {
      // Night → cool blue
      accent     = '#818cf8';
      accentDim  = 'rgba(129,140,248,0.12)';
      accentGlow = 'rgba(129,140,248,0.20)';
    } else {
      // Day → golden amber
      accent     = '#f59e0b';
      accentDim  = 'rgba(245,158,11,0.12)';
      accentGlow = 'rgba(245,158,11,0.22)';
    }
  } else if (weatherId > 800) {
    // Clouds → muted teal
    accent     = '#34d399';
    accentDim  = 'rgba(52,211,153,0.10)';
    accentGlow = 'rgba(52,211,153,0.18)';
  } else {
    // Fallback
    accent     = '#f59e0b';
    accentDim  = 'rgba(245,158,11,0.12)';
    accentGlow = 'rgba(245,158,11,0.22)';
  }

  const root = document.documentElement;
  root.style.setProperty('--accent',      accent);
  root.style.setProperty('--accent-dim',  accentDim);
  root.style.setProperty('--accent-glow', accentGlow);

  // Re-apply temperature gradient (can't update CSS variable inside -webkit-text-fill-color trick)
  // We patch the inline style directly
  $temperature.style.backgroundImage =
    `linear-gradient(160deg, #fff 40%, ${accent} 120%)`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getLocalTime(timezoneOffsetSeconds) {
  const utc  = Date.now() + new Date().getTimezoneOffset() * 60000;
  const local = new Date(utc + timezoneOffsetSeconds * 1000);
  return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
       + ', '
       + local.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function showLoading(text = 'Loading…') {
  hideAll();
  $loadingText.textContent = text;
  $loading.removeAttribute('hidden');
}

function showError(message, allowSearch = false) {
  hideAll();
  $errorText.textContent = message;
  $error.removeAttribute('hidden');
  if (allowSearch) $searchInput.focus();
}

function hideAll() {
  $loading.hidden = true;
  $error.hidden   = true;
  $card.hidden    = true;
}

// ── Start ──────────────────────────────────────────────────────────────────

init();
