# Weather Application 🌤️

A modern, clean, and responsive Weather Application built using vanilla frontend technologies. The app automatically detects the user's current location via the browser's Geolocation API to serve real-time weather details or allows for a manual city search fallback using the OpenWeather API.

## 🚀 Features
* **Automatic Geolocation:** Instantly fetches local weather data upon page load.
* **Manual Search:** A sleek search interface allowing users to look up weather conditions for any city globally.
* **Real-time Data:** Fetches precise weather information from the OpenWeather 'Current Weather Data' API including:
  * Current Temperature (°C)
  * Weather Conditions & Dynamic Icons
  * "Feels Like" Temperature
  * Humidity Levels (%)
  * Wind Speed (m/s)
* **Premium UI Design:** Structured with modern semantic HTML5 and customized using responsive CSS variables for optimal mobile and desktop viewing.
* **Robust Error Handling:** Gracefully handles denied location permissions, invalid city names, and network connectivity issues with user-friendly error prompts.

## 🛠️ Technologies Used
* **HTML5:** 
* **CSS3:** 
* **JavaScript (ES6+):**

## 📋 How to Run Locally
1. Clone or download this repository.
2. Open `script.js` and insert your OpenWeather API key:
```javascript
   const API_KEY = 'YOUR_API_KEY_HERE';
