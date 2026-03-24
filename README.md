# Skies

A clean, responsive weather web app built with HTML, CSS, and JavaScript. No frameworks, no build tools, no API keys required.

## Features

- Search any city in the world by name
- Current temperature, feels like, high and low for the day
- Humidity, wind speed and direction, UV index, visibility, pressure, and dew point
- Rain probability with an animated arc gauge
- Sunrise and sunset times with a live sun position indicator
- 24-hour hourly forecast with scrollable cards
- 7-day weekly forecast
- Air quality index using the European AQI scale
- Animated backgrounds that change based on current weather conditions (sunny, rainy, stormy, snowy, foggy, night)
- Fully responsive layout for both mobile and desktop

## Getting Started

No installation or setup needed. Download `skies-merged.html` and open it in any modern browser.

```
open skies-merged.html
```

That is all. The app loads Thiruvananthapuram by default on startup.

## Usage

Type a city name into the search bar and press Enter or click the search button. The app will fetch current conditions and the 7-day forecast for that location and update the background theme automatically.

## How It Works

Skies uses two free, open APIs that require no authentication.

**Geocoding.** When you search for a city, the app sends the name to the Open-Meteo Geocoding API, which returns coordinates and country information.

**Weather data.** Those coordinates are passed to the Open-Meteo forecast API, which returns current conditions, hourly data for the next 24 hours, and daily data for the next 7 days. A separate call to the Open-Meteo Air Quality API fetches the current AQI reading.

All three API calls run in parallel on every search.

## APIs Used

| API | Purpose | Cost |
|-----|---------|------|
| Open-Meteo Forecast | Weather and hourly/daily data | Free, no key |
| Open-Meteo Geocoding | City name to coordinates | Free, no key |
| Open-Meteo Air Quality | AQI readings | Free, no key |

## File Structure

The project comes in two versions.

```
skies-merged.html   # Single self-contained file (recommended for quick preview)
index.html          # HTML structure only
style.css           # All styles and theme definitions
app.js              # API calls and rendering logic
```

Use the merged version if you want to open it directly on a phone or share it as a single file. Use the three-file version for any further development or if your assignment requires separate files.

## Weather Themes

The background animates automatically based on the current weather code returned by the API.

| Condition | Theme |
|-----------|-------|
| Clear sky | Blue sky with a glowing pulsing sun |
| Sunny | Orange and amber sky with an intense sun |
| Partly cloudy | Drifting clouds over a blue sky |
| Overcast | Dark grey tones with slow cloud movement |
| Rain | Dark blue sky with animated rain streaks |
| Thunderstorm | Near-black sky with periodic lightning flashes |
| Snow | Pale blue sky with falling snow particles |
| Fog or haze | Muted tones with a blurred overlay |
| Night | Deep navy sky with twinkling stars |

## Tech Stack

- HTML5
- CSS3 (custom properties, grid, flexbox, keyframe animations, backdrop-filter)
- Vanilla JavaScript (ES2020, async/await, Fetch API)

## Browser Support

Works in all modern browsers. Requires an internet connection to fetch weather data.

## Credits

Weather data provided by [Open-Meteo](https://open-meteo.com). Fonts served by Google Fonts (DM Serif Display and Syne).
