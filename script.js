// ========================================
// API
// ========================================

const GEO_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


// ========================================
// ELEMENTS
// ========================================

const cityInput =
    document.getElementById("cityInput");

const searchBtn =
    document.getElementById("searchBtn");

const cityName =
    document.getElementById("cityName");

const temperature =
    document.getElementById("temperature");

const weatherDescription =
    document.getElementById("weatherDescription");

const weatherIcon =
    document.getElementById("weatherIcon");

const feelsLike =
    document.getElementById("feelsLike");

const humidity =
    document.getElementById("humidity");

const wind =
    document.getElementById("wind");

const rainChance =
    document.getElementById("rainChance");

const hourlyForecast =
    document.getElementById("hourlyForecast");

const dailyForecast =
    document.getElementById("dailyForecast");

const status =
    document.getElementById("status");

const citiesList =
    document.getElementById("citiesList");

const mapLocation =
    document.getElementById("mapLocation");

const weatherMap =
    document.getElementById("weatherMap");

const unitSelect =
    document.getElementById("unitSelect");

const autoRefresh =
    document.getElementById("autoRefresh");

const settingsCity =
    document.getElementById("settingsCity");

const weatherFromSettings =
    document.getElementById(
        "weatherFromSettings"
    );


// ========================================
// VARIABLES
// ========================================

let currentLocation = null;

let currentWeatherData = null;

let temperatureUnit = "celsius";

let refreshTimer;


// ========================================
// WEATHER CODE
// ========================================

function getWeatherInfo(code) {

    if (code === 0) {
        return {
            description: "Clear Sky",
            icon: "☀️"
        };
    }

    if (code === 1) {
        return {
            description: "Mainly Clear",
            icon: "🌤️"
        };
    }

    if (code === 2) {
        return {
            description: "Partly Cloudy",
            icon: "⛅"
        };
    }

    if (code === 3) {
        return {
            description: "Overcast",
            icon: "☁️"
        };
    }

    if (code === 45 || code === 48) {
        return {
            description: "Fog",
            icon: "🌫️"
        };
    }

    if (
        code >= 51 &&
        code <= 57
    ) {
        return {
            description: "Drizzle",
            icon: "🌦️"
        };
    }

    if (
        code >= 61 &&
        code <= 67
    ) {
        return {
            description: "Rain",
            icon: "🌧️"
        };
    }

    if (
        code >= 71 &&
        code <= 77
    ) {
        return {
            description: "Snow",
            icon: "❄️"
        };
    }

    if (
        code >= 80 &&
        code <= 82
    ) {
        return {
            description: "Rain Showers",
            icon: "🌦️"
        };
    }

    if (
        code === 85 ||
        code === 86
    ) {
        return {
            description: "Snow Showers",
            icon: "🌨️"
        };
    }

    if (
        code >= 95
    ) {
        return {
            description: "Thunderstorm",
            icon: "⛈️"
        };
    }

    return {
        description: "Unknown",
        icon: "🌤️"
    };
}


// ========================================
// TEMPERATURE CONVERSION
// ========================================

function convertTemperature(celsius) {

    if (temperatureUnit === "fahrenheit") {

        return Math.round(
            (celsius * 9 / 5) + 32
        );

    }

    return Math.round(celsius);
}


// ========================================
// SEARCH CITY
// ========================================

async function searchCity(city) {

    const url =
        `${GEO_API}?name=${encodeURIComponent(city)}` +
        `&count=1&language=en&format=json`;

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "Unable to search city."
        );
    }

    const data =
        await response.json();

    if (
        !data.results ||
        data.results.length === 0
    ) {

        throw new Error(
            "City not found."
        );
    }

    return data.results[0];
}


// ========================================
// GET WEATHER
// ========================================

async function getWeather(
    latitude,
    longitude
) {

    const url =
        `${WEATHER_API}?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current=` +
        `temperature_2m,` +
        `relative_humidity_2m,` +
        `apparent_temperature,` +
        `precipitation,` +
        `weather_code,` +
        `wind_speed_10m` +
        `&hourly=` +
        `temperature_2m,` +
        `weather_code,` +
        `precipitation_probability` +
        `&daily=` +
        `weather_code,` +
        `temperature_2m_max,` +
        `temperature_2m_min,` +
        `precipitation_probability_max` +
        `&timezone=auto` +
        `&forecast_days=7`;

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "Unable to get weather data."
        );
    }

    return await response.json();
}


// ========================================
// CURRENT HOUR
// ========================================

function findCurrentHourIndex(times) {

    const now =
        new Date();

    let closestIndex = 0;

    let smallestDifference =
        Infinity;


    times.forEach(
        (time, index) => {

            const date =
                new Date(time);

            const difference =
                Math.abs(
                    date.getTime() -
                    now.getTime()
                );


            if (
                difference <
                smallestDifference
            ) {

                smallestDifference =
                    difference;

                closestIndex =
                    index;
            }

        }
    );


    return closestIndex;
}


// ========================================
// DISPLAY CURRENT WEATHER
// ========================================

function displayCurrentWeather(
    location,
    data
) {

    const current =
        data.current;

    const info =
        getWeatherInfo(
            current.weather_code
        );


    cityName.textContent =
        `${location.name}, ${location.country}`;


    temperature.textContent =
        convertTemperature(
            current.temperature_2m
        );


    weatherDescription.textContent =
        info.description;


    weatherIcon.textContent =
        info.icon;


    feelsLike.textContent =
        convertTemperature(
            current.apparent_temperature
        );


    humidity.textContent =
        current.relative_humidity_2m;


    wind.textContent =
        Math.round(
            current.wind_speed_10m
        );


    const index =
        findCurrentHourIndex(
            data.hourly.time
        );


    rainChance.textContent =
        data.hourly
            .precipitation_probability[
                index
            ] ?? 0;


    settingsCity.textContent =
        location.name;
}


// ========================================
// HOURLY FORECAST
// ========================================

function displayHourlyForecast(data) {

    hourlyForecast.innerHTML = "";

    const times =
        data.hourly.time;

    const temperatures =
        data.hourly.temperature_2m;

    const codes =
        data.hourly.weather_code;


    const startIndex =
        findCurrentHourIndex(times);


    for (
        let i = startIndex;
        i < startIndex + 6 &&
        i < times.length;
        i++
    ) {

        const date =
            new Date(times[i]);


        const time =
            date.toLocaleTimeString(
                [],
                {
                    hour: "numeric"
                }
            );


        const info =
            getWeatherInfo(
                codes[i]
            );


        const temp =
            convertTemperature(
                temperatures[i]
            );


        const div =
            document.createElement(
                "div"
            );


        div.className = "hour";


        div.innerHTML = `

            <p>${time}</p>

            <div class="hour-icon">
                ${info.icon}
            </div>

            <h3>${temp}°</h3>

        `;


        hourlyForecast.appendChild(div);
    }
}


// ========================================
// DAILY FORECAST
// ========================================

function displayDailyForecast(data) {

    dailyForecast.innerHTML = "";


    const dates =
        data.daily.time;

    const codes =
        data.daily.weather_code;

    const maxTemps =
        data.daily.temperature_2m_max;

    const minTemps =
        data.daily.temperature_2m_min;

    const rain =
        data.daily
            .precipitation_probability_max;


    dates.forEach(
        (dateString, index) => {

            const date =
                new Date(
                    dateString +
                    "T12:00:00"
                );


            let dayName;


            if (index === 0) {

                dayName = "Today";

            } else {

                dayName =
                    date.toLocaleDateString(
                        [],
                        {
                            weekday: "short"
                        }
                    );
            }


            const info =
                getWeatherInfo(
                    codes[index]
                );


            const max =
                convertTemperature(
                    maxTemps[index]
                );


            const min =
                convertTemperature(
                    minTemps[index]
                );


            const div =
                document.createElement(
                    "div"
                );


            div.className = "day";


            div.innerHTML = `

                <div class="day-name">
                    ${dayName}
                </div>

                <div class="day-weather">

                    <span class="day-icon">
                        ${info.icon}
                    </span>

                    <span>
                        ${info.description}
                    </span>

                </div>

                <div class="day-temperature">
                    ${max}° / ${min}°
                    &nbsp;
                    <small>
                        ${rain[index] ?? 0}%
                    </small>
                </div>

            `;


            dailyForecast.appendChild(
                div
            );

        }
    );
}


// ========================================
// SAVE CITY
// ========================================

function saveCity(location) {

    let cities =
        JSON.parse(
            localStorage.getItem(
                "weatherCities"
            )
        ) || [];


    const exists =
        cities.some(
            city =>
                city.name ===
                location.name
        );


    if (!exists) {

        cities.push({

            name: location.name,

            country:
                location.country,

            latitude:
                location.latitude,

            longitude:
                location.longitude

        });


        // Keep only last 8 cities
        if (cities.length > 8) {

            cities.shift();

        }


        localStorage.setItem(
            "weatherCities",
            JSON.stringify(cities)
        );
    }


    displayCities();
}


// ========================================
// DISPLAY CITIES
// ========================================

function displayCities() {

    citiesList.innerHTML = "";


    const cities =
        JSON.parse(
            localStorage.getItem(
                "weatherCities"
            )
        ) || [];


    if (cities.length === 0) {

        citiesList.innerHTML = `

            <div class="card">

                <h2>No cities yet</h2>

                <p>
                    Search for a city to add it here.
                </p>

            </div>

        `;

        return;
    }


    cities.forEach(city => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "city-card";


        div.innerHTML = `

            <h2>
                🏙️ ${city.name}
            </h2>

            <p>
                ${city.country}
            </p>

            <button>
                View Weather
            </button>

        `;


        div.querySelector(
            "button"
        ).addEventListener(
            "click",
            () => {

                cityInput.value =
                    city.name;

                loadWeather(
                    city.name
                );

                showPage(
                    "weatherPage"
                );

            }
        );


        citiesList.appendChild(div);

    });
}


// ========================================
// UPDATE MAP
// ========================================

function updateMap(location) {

    const lat =
        location.latitude;

    const lon =
        location.longitude;


    const delta = 0.15;


    const bbox =
        `${lon - delta}%2C` +
        `${lat - delta}%2C` +
        `${lon + delta}%2C` +
        `${lat + delta}`;


    weatherMap.src =
        `https://www.openstreetmap.org/export/embed.html` +
        `?bbox=${bbox}` +
        `&layer=mapnik`;


    mapLocation.textContent =
        `${location.name}, ${location.country}`;
}


// ========================================
// LOAD WEATHER
// ========================================

async function loadWeather(city) {

    try {

        status.textContent =
            "Loading weather...";

        status.className = "";


        const location =
            await searchCity(city);


        const weather =
            await getWeather(
                location.latitude,
                location.longitude
            );


        currentLocation =
            location;

        currentWeatherData =
            weather;


        displayCurrentWeather(
            location,
            weather
        );


        displayHourlyForecast(
            weather
        );


        displayDailyForecast(
            weather
        );


        updateMap(
            location
        );


        saveCity(
            location
        );


        status.textContent =
            `Updated • ${weather.timezone}`;


    } catch (error) {

        console.error(error);

        status.textContent =
            error.message;

        status.className =
            "error";
    }
}


// ========================================
// PAGE NAVIGATION
// ========================================

const navLinks =
    document.querySelectorAll(
        ".nav-link"
    );


const pages =
    document.querySelectorAll(
        ".page"
    );


function showPage(pageId) {

    pages.forEach(page => {

        page.classList.remove(
            "active-page"
        );

    });


    const selectedPage =
        document.getElementById(
            pageId
        );


    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );
    }


    navLinks.forEach(link => {

        link.classList.remove(
            "active"
        );


        if (
            link.dataset.page ===
            pageId
        ) {

            link.classList.add(
                "active"
            );

        }

    });


    if (pageId === "citiesPage") {

        displayCities();

    }

}


navLinks.forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();

            showPage(
                link.dataset.page
            );

        }
    );

});


// ========================================
// SEARCH
// ========================================

searchBtn.addEventListener(
    "click",
    () => {

        const city =
            cityInput.value.trim();


        if (!city) {

            status.textContent =
                "Please enter a city.";

            status.className =
                "error";

            return;
        }


        showPage(
            "weatherPage"
        );


        loadWeather(city);

    }
);


// ENTER KEY

cityInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            searchBtn.click();

        }

    }
);


// ========================================
// TEMPERATURE SETTING
// ========================================

unitSelect.addEventListener(
    "change",
    () => {

        temperatureUnit =
            unitSelect.value;


        if (
            currentLocation &&
            currentWeatherData
        ) {

            displayCurrentWeather(
                currentLocation,
                currentWeatherData
            );

            displayHourlyForecast(
                currentWeatherData
            );

            displayDailyForecast(
                currentWeatherData
            );

        }

    }
);


// ========================================
// AUTO REFRESH
// ========================================

function startAutoRefresh() {

    clearInterval(
        refreshTimer
    );


    refreshTimer =
        setInterval(
            () => {

                if (
                    currentLocation
                ) {

                    getWeather(
                        currentLocation.latitude,
                        currentLocation.longitude
                    )
                    .then(data => {

                        currentWeatherData =
                            data;


                        displayCurrentWeather(
                            currentLocation,
                            data
                        );


                        displayHourlyForecast(
                            data
                        );


                        displayDailyForecast(
                            data
                        );

                    });

                }

            },
            5 * 60 * 1000
        );
}


autoRefresh.addEventListener(
    "change",
    () => {

        if (
            autoRefresh.checked
        ) {

            startAutoRefresh();

        } else {

            clearInterval(
                refreshTimer
            );

        }

    }
);


// ========================================
// SETTINGS → WEATHER
// ========================================

weatherFromSettings.addEventListener(
    "click",
    () => {

        showPage(
            "weatherPage"
        );

    }
);


// ========================================
// START
// ========================================

displayCities();

loadWeather(
    "Kolkata"
);

startAutoRefresh();