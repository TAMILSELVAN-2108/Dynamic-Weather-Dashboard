const API_KEY = "b1f096fa86e9f7effc005f875faf7ad7";

// DOM elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const extra = document.getElementById("extra");
const weatherIcon = document.getElementById("weatherIcon");
const forecastCards = document.getElementById("forecastCards");
const backgroundContainer = document.getElementById("background-container");
const dateTime = document.getElementById("dateTime");
const rainAudio = document.getElementById("rainAudio");
const thunderAudio = document.getElementById("thunderAudio");
const chartCanvas = document.getElementById("weatherChart");

let weatherChart;

const backgrounds = {
  clear: "clear.mp4",
  clouds: "clouds.mp4",
  rain: "rain.mp4",
  storm: "thunder.mp4",
  thunder: "thunder.mp4",
  mist: "mist.mp4"
};

// Weather API
async function getCurrentWeather(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error("City not found");
  return res.json();
}
async function getForecast(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
  );
  if (!res.ok) throw new Error("Forecast fetch failed");
  return res.json();
}
async function searchCity(query) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&appid=${API_KEY}`
  );
  const data = await res.json();
  if (data.count > 0) return data.list[0].name;
  return query;
}

// Background and sound
function setWeatherBackground(condition) {
  backgroundContainer.innerHTML = "";
  let file = "clear.mp4";
  if (condition.includes("rain")) file = backgrounds.rain;
  else if (condition.includes("storm") || condition.includes("thunder")) file = backgrounds.storm;
  else if (condition.includes("cloud")) file = backgrounds.clouds;
  else if (condition.includes("mist") || condition.includes("fog")) file = backgrounds.mist;

  const video = document.createElement("video");
  video.src = file;
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.classList.add("active");
  backgroundContainer.appendChild(video);

  rainAudio.pause();
  thunderAudio.pause();
  if (file === backgrounds.rain) rainAudio.play();
  if (file === backgrounds.storm) thunderAudio.play();
}

// Theme (dark/light)
function setTheme(sunrise, sunset) {
  const now = Math.floor(Date.now() / 1000);
  document.body.style.color = (now > sunrise && now < sunset) ? "#222" : "#fff";
}

// Update current weather
function updateCurrent(data) {
  cityName.textContent = data.name;
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  description.textContent = data.weather[0].description;
  extra.textContent = `Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s`;
  weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png"/>`;
  setWeatherBackground(data.weather[0].main.toLowerCase());
  setTheme(data.sys.sunrise, data.sys.sunset);
  dateTime.textContent = new Date().toLocaleString();
}

// Forecast
function updateForecast(data) {
  forecastCards.innerHTML = "";
  const daily = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: "short" });
    if (!daily[date]) daily[date] = [];
    daily[date].push(item);
  });

  Object.keys(daily).slice(0, 5).forEach(day => {
    const temps = daily[day].map(i => i.main.temp);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b) / temps.length);
    const icon = daily[day][0].weather[0].icon;
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <h4>${day}</h4>
      <img src="https://openweathermap.org/img/wn/${icon}.png"/>
      <p>${avgTemp}°C</p>
    `;
    forecastCards.appendChild(card);
  });
}

// Interactive Chart
function updateChart(data) {
  const labels = data.list.slice(0, 12).map(i => new Date(i.dt * 1000).toLocaleTimeString());
  const temps = data.list.slice(0, 12).map(i => i.main.temp);
  const humidity = data.list.slice(0, 12).map(i => i.main.humidity);
  const wind = data.list.slice(0, 12).map(i => i.wind.speed);

  if (weatherChart) weatherChart.destroy();
  weatherChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: "Temperature (°C)", data: temps, borderColor: "#6a5acd", backgroundColor: "rgba(106,90,205,0.3)", fill: true, tension: 0.4 },
        { label: "Humidity (%)", data: humidity, borderColor: "#00ced1", backgroundColor: "rgba(0,206,209,0.3)", fill: true, tension: 0.4 },
        { label: "Wind Speed (m/s)", data: wind, borderColor: "#ff8c00", backgroundColor: "rgba(255,140,0,0.3)", fill: true, tension: 0.4 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        legend: { position: 'top', labels: { color: '#fff' } }
      },
      scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } }
    }
  });
}

// Load weather
async function loadWeather(city) {
  try {
    const actualCity = await searchCity(city);
    const current = await getCurrentWeather(actualCity);
    updateCurrent(current);
    const forecast = await getForecast(actualCity);
    updateForecast(forecast);
    updateChart(forecast);
  } catch (err) {
    alert(err.message);
  }
}

// Search events
searchBtn.addEventListener("click", () => loadWeather(cityInput.value.trim()));
cityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") loadWeather(cityInput.value.trim()); });

// Default location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`);
    const data = await res.json();
    loadWeather(data.name);
  }, () => loadWeather("London"));
} else {
  loadWeather("London");
}
// Extra details
const visibilityEl = document.getElementById("visibility");
const pressureEl = document.getElementById("pressure");
const dewPointEl = document.getElementById("dewPoint");
const aqiEl = document.getElementById("aqi");
const uvEl = document.getElementById("uv");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const indiaCitiesEl = document.getElementById("indiaCities");
const themeToggle = document.getElementById("themeToggle");

// Fetch Air Quality
async function getAirQuality(lat, lon) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
  const data = await res.json();
  return data.list[0].main.aqi;
}

// Update Details
function updateDetails(data) {
  visibilityEl.textContent = (data.visibility/1000).toFixed(1) + " km";
  pressureEl.textContent = data.main.pressure + " hPa";
  dewPointEl.textContent = (data.main.temp - ((100 - data.main.humidity)/5)).toFixed(1) + "°C";
  sunriseEl.textContent = new Date(data.sys.sunrise*1000).toLocaleTimeString();
  sunsetEl.textContent = new Date(data.sys.sunset*1000).toLocaleTimeString();
}

// Update Indian Cities
async function updateIndiaCities() {
  const cities = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad"];
  indiaCitiesEl.innerHTML = "";
  for (const city of cities) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
    const data = await res.json();
    const card = document.createElement("div");
    card.className = "city-card";
    card.innerHTML = `
      <h4>${city}</h4>
      <p>${Math.round(data.main.temp)}°C</p>
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png"/>
    `;
    indiaCitiesEl.appendChild(card);
  }
}

// Theme toggle
// Default = Dark mode
document.body.classList.add("dark-theme");
themeToggle.classList.add("moon");
themeToggle.textContent = "🌙";

// Toggle between light/dark
themeToggle.addEventListener("click", () => {
  if (document.body.classList.contains("dark-theme")) {
    document.body.classList.replace("dark-theme", "light-theme");
    themeToggle.classList.replace("moon", "sun");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.replace("light-theme", "dark-theme");
    themeToggle.classList.replace("sun", "moon");
    themeToggle.textContent = "🌙";
  }
});


// Main update
async function loadWeather(city) {
  try {
    const actualCity = await searchCity(city);
    const current = await getCurrentWeather(actualCity);
    updateCurrent(current);
    updateDetails(current);

    const aqi = await getAirQuality(current.coord.lat, current.coord.lon);
    aqiEl.textContent = aqi;

    const forecast = await getForecast(actualCity);
    updateForecast(forecast);
    updateChart(forecast);

    updateIndiaCities();
  } catch (err) {
    alert(err.message);
  }
}
