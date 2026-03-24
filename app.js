// ============================================================
// SKIES Weather App
// APIs: Open-Meteo (weather) + Open-Meteo Geocoding (city search)
// No API key required.
// ============================================================

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_URL     = 'https://air-quality-api.open-meteo.com/v1/air-quality';

// DOM refs
const cityInput    = document.getElementById('cityInput');
const searchBtn    = document.getElementById('searchBtn');
const loadingState = document.getElementById('loadingState');
const errorState   = document.getElementById('errorState');
const errorMsg     = document.getElementById('errorMsg');
const weatherContent = document.getElementById('weatherContent');

// ---- WMO weather code -> label + emoji ----
const WMO = {
  0:  { label: 'Clear Sky',       icon: '☀️',  theme: 'sunny'  },
  1:  { label: 'Mostly Clear',    icon: '🌤️',  theme: 'default' },
  2:  { label: 'Partly Cloudy',   icon: '⛅',   theme: 'default' },
  3:  { label: 'Overcast',        icon: '☁️',  theme: 'cloudy' },
  45: { label: 'Foggy',           icon: '🌫️',  theme: 'haze'   },
  48: { label: 'Freezing Fog',    icon: '🌫️',  theme: 'haze'   },
  51: { label: 'Light Drizzle',   icon: '🌦️',  theme: 'rainy'  },
  53: { label: 'Drizzle',         icon: '🌦️',  theme: 'rainy'  },
  55: { label: 'Heavy Drizzle',   icon: '🌧️',  theme: 'rainy'  },
  61: { label: 'Light Rain',      icon: '🌧️',  theme: 'rainy'  },
  63: { label: 'Moderate Rain',   icon: '🌧️',  theme: 'rainy'  },
  65: { label: 'Heavy Rain',      icon: '🌧️',  theme: 'rainy'  },
  71: { label: 'Light Snow',      icon: '🌨️',  theme: 'snowy'  },
  73: { label: 'Moderate Snow',   icon: '❄️',  theme: 'snowy'  },
  75: { label: 'Heavy Snow',      icon: '❄️',  theme: 'snowy'  },
  77: { label: 'Snow Grains',     icon: '🌨️',  theme: 'snowy'  },
  80: { label: 'Light Showers',   icon: '🌦️',  theme: 'rainy'  },
  81: { label: 'Rain Showers',    icon: '🌧️',  theme: 'rainy'  },
  82: { label: 'Heavy Showers',   icon: '⛈️',  theme: 'stormy' },
  85: { label: 'Snow Showers',    icon: '🌨️',  theme: 'snowy'  },
  86: { label: 'Heavy Snow Showers',icon:'❄️', theme: 'snowy'  },
  95: { label: 'Thunderstorm',    icon: '⛈️',  theme: 'stormy' },
  96: { label: 'Thunderstorm',    icon: '⛈️',  theme: 'stormy' },
  99: { label: 'Severe Thunderstorm',icon:'🌩️',theme: 'stormy' },
};

function getWMO(code) {
  return WMO[code] || { label: 'Unknown', icon: '🌡️', theme: 'default' };
}

// ---- Determine if it's night based on local time ----
function isNightTime(sunrise, sunset) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [rH, rM] = sunrise.split(':').map(Number);
  const [sH, sM] = sunset.split(':').map(Number);
  const riseMins = rH * 60 + rM;
  const setMins  = sH * 60 + sM;
  return nowMins < riseMins || nowMins > setMins;
}

// ---- UV label ----
function uvLabel(uv) {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

// ---- AQI label from European AQI index ----
function aqiLabel(aqi) {
  if (aqi <= 20) return 'Good';
  if (aqi <= 40) return 'Fair';
  if (aqi <= 60) return 'Moderate';
  if (aqi <= 80) return 'Poor';
  return 'Very Poor';
}

// ---- Wind direction from degrees ----
function windDir(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ---- Format time from "HH:MM" string ----
function fmtTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

// ---- Format date ----
function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}

function dayName(dateStr, i) {
  if (i === 0) return 'Today';
  if (i === 1) return 'Tomorrow';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
}

// ---- States ----
function showLoading() {
  loadingState.classList.add('visible');
  errorState.classList.remove('visible');
  weatherContent.classList.remove('visible');
}
function showError(msg) {
  loadingState.classList.remove('visible');
  errorState.classList.add('visible');
  errorMsg.textContent = msg;
  weatherContent.classList.remove('visible');
}
function showWeather() {
  loadingState.classList.remove('visible');
  errorState.classList.remove('visible');
  weatherContent.classList.add('visible');
}

// ---- Apply theme ----
function applyTheme(code, sunrise, sunset) {
  const wmo = getWMO(code);
  const night = isNightTime(sunrise, sunset);

  const body = document.body;
  body.className = '';

  if (night) {
    body.classList.add('theme-night');
  } else {
    body.classList.add('theme-' + wmo.theme);
  }
}

// ---- Rain arc animation ----
function setRainArc(percent) {
  const arc = document.getElementById('rainArc');
  const totalLen = 157; // approximate arc path length
  const filled = (percent / 100) * totalLen;
  arc.style.strokeDasharray = `${filled} ${totalLen - filled}`;
}

// ---- Sun position dot ----
function setSunDot(sunrise, sunset) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [rH, rM] = sunrise.split(':').map(Number);
  const [sH, sM] = sunset.split(':').map(Number);
  const riseMins = rH * 60 + rM;
  const setMins  = sH * 60 + sM;

  const dot = document.getElementById('sunDot');

  let progress = (nowMins - riseMins) / (setMins - riseMins);
  progress = Math.max(0, Math.min(1, progress));

  // Arc from (5,45) to (75,45) with radius 35
  const angle = Math.PI * (1 - progress); // PI = start, 0 = end
  const cx = 40 + 35 * Math.cos(Math.PI - angle);
  const cy = 45 - 35 * Math.sin(Math.PI - angle);
  // Parametric arc: center at (40,45), r=35, angle from PI to 0
  const arcCx = 40 - 35 * Math.cos(angle);
  const arcCy = 45 - 35 * Math.sin(angle);

  dot.setAttribute('cx', arcCx.toFixed(1));
  dot.setAttribute('cy', arcCy.toFixed(1));
}

// ---- Daylight hours ----
function daylightDuration(sunrise, sunset) {
  const [rH, rM] = sunrise.split(':').map(Number);
  const [sH, sM] = sunset.split(':').map(Number);
  const mins = (sH * 60 + sM) - (rH * 60 + rM);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// ---- AQI bar ----
function setAQIBar(aqi) {
  const fill = document.getElementById('aqiBarFill');
  // Map 0-100 aqi to 0-100% bar (right side hides)
  const pct = Math.max(0, Math.min(100, (100 - aqi)));
  fill.style.width = pct + '%';
}

// ---- Hourly render ----
function renderHourly(hourly, currentCode, sunrise, sunset) {
  const container = document.getElementById('hourlyScroll');
  container.innerHTML = '';

  const now = new Date();
  const nowHour = now.getHours();

  // Find current hour index
  const times = hourly.time;
  const temps  = hourly.temperature_2m;
  const codes  = hourly.weathercode;
  const rain   = hourly.precipitation_probability;

  // Show next 24 hours from now
  let startIdx = times.findIndex(t => {
    const h = new Date(t).getHours();
    return h === nowHour;
  });
  if (startIdx < 0) startIdx = 0;

  for (let i = startIdx; i < Math.min(startIdx + 24, times.length); i++) {
    const t = new Date(times[i]);
    const h = t.getHours();
    const isCurrent = i === startIdx;
    const night = h < new Date(sunrise + 'T00:00:00').getHours() || h > new Date(sunset + 'T00:00:00').getHours();
    const wmo = getWMO(codes[i] || 0);

    const card = document.createElement('div');
    card.className = 'hour-card' + (isCurrent ? ' current' : '');

    const timeLabel = isCurrent ? 'Now' : (h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`);

    card.innerHTML = `
      <div class="hour-time">${timeLabel}</div>
      <div class="hour-icon">${wmo.icon}</div>
      <div class="hour-temp">${Math.round(temps[i])}°</div>
      ${rain[i] > 0 ? `<div class="hour-rain">${rain[i]}%</div>` : ''}
    `;
    container.appendChild(card);
  }
}

// ---- Weekly render ----
function renderWeekly(daily) {
  const list = document.getElementById('weeklyList');
  list.innerHTML = '';

  const dates  = daily.time;
  const maxT   = daily.temperature_2m_max;
  const minT   = daily.temperature_2m_min;
  const codes  = daily.weathercode;
  const rain   = daily.precipitation_probability_max;

  for (let i = 0; i < dates.length; i++) {
    const wmo = getWMO(codes[i] || 0);
    const row = document.createElement('div');
    row.className = 'day-row';
    row.innerHTML = `
      <div class="day-name ${i === 0 ? 'today' : ''}">${dayName(dates[i], i)}</div>
      <div class="day-icon">${wmo.icon}</div>
      <div class="day-rain-chance">${rain[i] || 0}%</div>
      <div class="day-temps">${Math.round(maxT[i])}° <span class="low">${Math.round(minT[i])}°</span></div>
    `;
    list.appendChild(row);
  }
}

// ---- Main render ----
function renderWeather(geoData, weatherData, airData) {
  const city    = geoData.name;
  const country = geoData.country_code?.toUpperCase() || '';
  const tz      = weatherData.timezone;

  const c  = weatherData.current_weather;
  const d  = weatherData.daily;
  const h  = weatherData.hourly;

  const code     = c.weathercode;
  const temp     = Math.round(c.temperature);
  const wind     = Math.round(c.windspeed);
  const windDeg  = c.winddirection;

  const sunrise  = d.sunrise[0].split('T')[1];
  const sunset   = d.sunset[0].split('T')[1];

  const todayMaxT = Math.round(d.temperature_2m_max[0]);
  const todayMinT = Math.round(d.temperature_2m_min[0]);

  // Feels like from hourly (find current hour)
  const nowHour = new Date().getHours();
  const hIdx = h.time.findIndex(t => new Date(t).getHours() === nowHour);
  const feelsLike = hIdx >= 0 ? Math.round(h.apparent_temperature[hIdx]) : temp;
  const humidity  = hIdx >= 0 ? h.relativehumidity_2m[hIdx] : 0;
  const vis       = hIdx >= 0 ? (h.visibility[hIdx] / 1000).toFixed(1) : '--';
  const dewPt     = hIdx >= 0 ? Math.round(h.dewpoint_2m[hIdx]) : '--';
  const uvIdx     = hIdx >= 0 ? Math.round(h.uv_index[hIdx]) : 0;
  const rainChance = d.precipitation_probability_max[0] || 0;
  const pressure  = hIdx >= 0 ? Math.round(h.surface_pressure[hIdx]) : '--';

  const wmo = getWMO(code);

  // Apply theme
  applyTheme(code, sunrise, sunset);

  // Hero
  document.getElementById('heroCity').textContent = city;
  document.getElementById('heroCountry').textContent = country;
  document.getElementById('heroTemp').textContent = temp;
  document.getElementById('heroIcon').textContent = wmo.icon;
  document.getElementById('heroCondition').textContent = wmo.label;
  document.getElementById('heroFeels').textContent = feelsLike + 'C';
  document.getElementById('heroHigh').textContent = todayMaxT + 'C';
  document.getElementById('heroLow').textContent = todayMinT + 'C';
  document.getElementById('heroDate').textContent = fmtDate(d.time[0]);

  // Stats
  document.getElementById('statHumidity').textContent = humidity + '%';
  document.getElementById('barHumidity').style.width = humidity + '%';

  document.getElementById('statWind').textContent = wind + ' km/h';
  document.getElementById('statWindDir').textContent = windDir(windDeg);

  document.getElementById('statUV').textContent = uvIdx;
  document.getElementById('statUVLabel').textContent = uvLabel(uvIdx);

  document.getElementById('statVis').textContent = vis + ' km';
  document.getElementById('statPressure').textContent = pressure + ' mb';
  document.getElementById('statDew').textContent = dewPt + 'C';

  // Rain arc
  document.getElementById('rainPercent').textContent = rainChance + '%';
  setRainArc(rainChance);
  document.getElementById('rainDesc').textContent =
    rainChance < 20 ? 'Unlikely to rain' :
    rainChance < 50 ? 'Possible showers' :
    rainChance < 75 ? 'Likely to rain'   : 'Heavy rain expected';

  // Sun
  document.getElementById('sunRise').textContent = fmtTime(sunrise);
  document.getElementById('sunSet').textContent  = fmtTime(sunset);
  document.getElementById('daylightHours').textContent = daylightDuration(sunrise, sunset);
  setTimeout(() => setSunDot(sunrise, sunset), 300);

  // Hourly
  renderHourly(h, code, d.sunrise[0], d.sunset[0]);

  // Weekly
  renderWeekly(d);

  // AQI
  if (airData) {
    const aqiNow = airData.current?.european_aqi || 0;
    document.getElementById('aqiNumber').textContent = Math.round(aqiNow);
    document.getElementById('aqiLabel').textContent  = aqiLabel(aqiNow);
    setAQIBar(aqiNow);
  }

  showWeather();
}

// ---- Fetch weather ----
async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current_weather: true,
    timezone: 'auto',
    hourly: [
      'temperature_2m','apparent_temperature','relativehumidity_2m',
      'dewpoint_2m','precipitation_probability','weathercode',
      'surface_pressure','visibility','uv_index'
    ].join(','),
    daily: [
      'weathercode','temperature_2m_max','temperature_2m_min',
      'apparent_temperature_max','apparent_temperature_min',
      'sunrise','sunset','precipitation_probability_max'
    ].join(','),
    forecast_days: 7,
    wind_speed_unit: 'kmh',
  });

  const airParams = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'european_aqi',
    timezone: 'auto',
  });

  const [wRes, aRes] = await Promise.allSettled([
    fetch(`${WEATHER_URL}?${params}`).then(r => r.json()),
    fetch(`${AIR_URL}?${airParams}`).then(r => r.json()),
  ]);

  if (wRes.status !== 'fulfilled' || wRes.value.error) {
    throw new Error('Weather data unavailable');
  }

  return {
    weather: wRes.value,
    air: aRes.status === 'fulfilled' ? aRes.value : null,
  };
}

// ---- Geocode city ----
async function geocodeCity(city) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${city}" not found. Check spelling and try again.`);
  }

  return data.results[0];
}

// ---- Search handler ----
async function search() {
  const query = cityInput.value.trim();
  if (!query) return;

  showLoading();

  try {
    const geo = await geocodeCity(query);
    const { weather, air } = await fetchWeather(geo.latitude, geo.longitude);
    renderWeather(geo, weather, air);
  } catch (err) {
    showError(err.message || 'Something went wrong. Try again.');
  }
}

// ---- Events ----
searchBtn.addEventListener('click', search);
cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') search();
});

// ---- Load default city on start ----
window.addEventListener('load', () => {
  cityInput.value = 'Thiruvananthapuram';
  search();
});
