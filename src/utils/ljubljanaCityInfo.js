export const LJUBLJANA_WEATHER_COORDS = {
    latitude: 46.0507666,
    longitude: 14.5047565
};

const POLLUTANT_DEFINITIONS = [
    { key: 'pm2_5', labelKey: 'cityInfoPollutantPm25', unit: 'µg/m³', aqiKey: 'european_aqi_pm2_5' },
    { key: 'pm10', labelKey: 'cityInfoPollutantPm10', unit: 'µg/m³', aqiKey: 'european_aqi_pm10' },
    { key: 'nitrogen_dioxide', labelKey: 'cityInfoPollutantNo2', unit: 'µg/m³', aqiKey: 'european_aqi_no2' },
    { key: 'ozone', labelKey: 'cityInfoPollutantO3', unit: 'µg/m³', aqiKey: 'european_aqi_o3' },
    { key: 'carbon_monoxide', labelKey: 'cityInfoPollutantCo', unit: 'µg/m³', aqiKey: null },
    { key: 'sulphur_dioxide', labelKey: 'cityInfoPollutantSo2', unit: 'µg/m³', aqiKey: 'european_aqi_so2' }
];

const WEATHER_LABELS = {
    fr: {
        0: 'Ciel degage',
        1: 'Plutot degage',
        2: 'Partiellement nuageux',
        3: 'Couvert',
        45: 'Brume',
        48: 'Brouillard givrant',
        51: 'Bruine legere',
        53: 'Bruine',
        55: 'Bruine dense',
        56: 'Bruine verglaçante',
        57: 'Bruine verglaçante dense',
        61: 'Pluie legere',
        63: 'Pluie',
        65: 'Forte pluie',
        66: 'Pluie verglaçante',
        67: 'Forte pluie verglaçante',
        71: 'Neige legere',
        73: 'Neige',
        75: 'Forte neige',
        77: 'Grains de neige',
        80: 'Averses legeres',
        81: 'Averses',
        82: 'Fortes averses',
        85: 'Averses de neige',
        86: 'Fortes averses de neige',
        95: 'Orage',
        96: 'Orage et grele',
        99: 'Fort orage et grele'
    },
    en: {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Rime fog',
        51: 'Light drizzle',
        53: 'Drizzle',
        55: 'Dense drizzle',
        56: 'Freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Light rain',
        63: 'Rain',
        65: 'Heavy rain',
        66: 'Freezing rain',
        67: 'Heavy freezing rain',
        71: 'Light snow',
        73: 'Snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Light showers',
        81: 'Showers',
        82: 'Heavy showers',
        85: 'Snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Severe thunderstorm with hail'
    },
    sl: {
        0: 'Jasno',
        1: 'Pretezno jasno',
        2: 'Delno oblacno',
        3: 'Oblacno',
        45: 'Megla',
        48: 'Ivje in megla',
        51: 'Rahlo rosenje',
        53: 'Rosenje',
        55: 'Mocno rosenje',
        56: 'Poledeno rosenje',
        57: 'Mocno poledeno rosenje',
        61: 'Rahel dez',
        63: 'Dez',
        65: 'Mocan dez',
        66: 'Poledenel dez',
        67: 'Mocan poledenel dez',
        71: 'Rahlo snezenje',
        73: 'Snezenje',
        75: 'Mocno snezenje',
        77: 'Snezna zrna',
        80: 'Rahle plohe',
        81: 'Plohe',
        82: 'Mocne plohe',
        85: 'Snezne plohe',
        86: 'Mocne snezne plohe',
        95: 'Nevihta',
        96: 'Nevihta s toco',
        99: 'Mocna nevihta s toco'
    }
};

const DAY_FORMATTERS = {
    fr: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }),
    en: new Intl.DateTimeFormat('en-GB', { weekday: 'short' }),
    sl: new Intl.DateTimeFormat('sl-SI', { weekday: 'short' })
};

export function getAqiSeverity(aqi) {
    if (aqi <= 20) return 0;
    if (aqi <= 40) return 1;
    if (aqi <= 60) return 2;
    if (aqi <= 80) return 3;
    if (aqi <= 100) return 4;
    return 5;
}

export function getAqiCategory(aqi, language) {
    const categories = {
        fr: ['Bon', 'Correct', 'Modere', 'Moyen', 'Mauvais', 'Tres mauvais'],
        en: ['Good', 'Fair', 'Moderate', 'Poor', 'Very poor', 'Extremely poor'],
        sl: ['Dobra', 'Sprejemljiva', 'Zmerna', 'Slaba', 'Zelo slaba', 'Izjemno slaba']
    };
    const languageCategories = categories[language] || categories.fr;
    return languageCategories[getAqiSeverity(aqi)];
}

export function getWeatherLabel(weatherCode, language) {
    const labels = WEATHER_LABELS[language] || WEATHER_LABELS.fr;
    return labels[weatherCode] || labels[3];
}

function roundValue(value, digits = 0) {
    if (value == null) {
        return null;
    }

    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function average(values) {
    if (!values.length) {
        return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function groupHourlyValuesByDay(times, values, wantedDates) {
    const grouped = new Map();
    wantedDates.forEach((date) => grouped.set(date, []));

    times.forEach((time, index) => {
        const date = time.slice(0, 10);
        if (!grouped.has(date)) {
            return;
        }

        const value = values[index];
        if (value != null) {
            grouped.get(date).push(value);
        }
    });

    return grouped;
}

export async function fetchLjubljanaCityInfo(language, signal) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LJUBLJANA_WEATHER_COORDS.latitude}&longitude=${LJUBLJANA_WEATHER_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&forecast_days=6&timezone=auto`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LJUBLJANA_WEATHER_COORDS.latitude}&longitude=${LJUBLJANA_WEATHER_COORDS.longitude}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide,european_aqi_pm2_5,european_aqi_pm10,european_aqi_no2,european_aqi_o3,european_aqi_so2&hourly=european_aqi&forecast_hours=144&timezone=auto&domains=cams_europe`;
    const [weatherResponse, airResponse] = await Promise.all([
        fetch(weatherUrl, { signal }),
        fetch(airUrl, { signal })
    ]);

    if (!weatherResponse.ok || !airResponse.ok) {
        throw new Error('city-info-fetch-failed');
    }

    const [weatherData, airData] = await Promise.all([
        weatherResponse.json(),
        airResponse.json()
    ]);

    const currentWeather = weatherData?.current;
    const dailyWeather = weatherData?.daily;
    const hourlyWeather = weatherData?.hourly;
    const currentAir = airData?.current;
    const hourlyAir = airData?.hourly;

    if (!currentWeather || !dailyWeather || !hourlyWeather || !currentAir || !hourlyAir) {
        throw new Error('city-info-payload-invalid');
    }

    const forecastDates = dailyWeather.time.slice(0, 5);
    const humidityByDay = groupHourlyValuesByDay(hourlyWeather.time, hourlyWeather.relative_humidity_2m, forecastDates);
    const aqiByDay = groupHourlyValuesByDay(hourlyAir.time, hourlyAir.european_aqi, forecastDates);
    const formatter = DAY_FORMATTERS[language] || DAY_FORMATTERS.fr;

    const forecast = forecastDates.map((date, index) => {
        const humidityAverage = average(humidityByDay.get(date) || []);
        const aqiValues = aqiByDay.get(date) || [];
        const aqiMax = aqiValues.length ? Math.max(...aqiValues) : currentAir.european_aqi;
        const weatherCode = dailyWeather.weather_code[index];

        return {
            date,
            dayLabel: formatter.format(new Date(`${date}T12:00:00`)).replace('.', ''),
            weatherCode,
            weatherLabel: getWeatherLabel(weatherCode, language),
            temperatureMax: roundValue(dailyWeather.temperature_2m_max[index]),
            temperatureMin: roundValue(dailyWeather.temperature_2m_min[index]),
            windSpeed: roundValue(dailyWeather.wind_speed_10m_max[index]),
            humidity: roundValue(humidityAverage),
            precipitationProbability: roundValue(dailyWeather.precipitation_probability_max[index]),
            aqi: roundValue(aqiMax),
            aqiCategory: getAqiCategory(aqiMax, language),
            aqiSeverity: getAqiSeverity(aqiMax)
        };
    });

    const pollutants = POLLUTANT_DEFINITIONS.map((definition) => {
        const value = currentAir[definition.key];
        const aqiValue = definition.aqiKey ? currentAir[definition.aqiKey] : currentAir.european_aqi;
        return {
            key: definition.key,
            labelKey: definition.labelKey,
            unit: definition.unit,
            value: roundValue(value, definition.key === 'carbon_monoxide' ? 0 : 1),
            aqi: roundValue(aqiValue),
            aqiCategory: getAqiCategory(aqiValue, language),
            aqiSeverity: getAqiSeverity(aqiValue),
            barWidth: `${Math.min(100, Math.max(8, roundValue(aqiValue)))}%`
        };
    });

    return {
        current: {
            time: currentWeather.time,
            temperature: roundValue(currentWeather.temperature_2m),
            humidity: roundValue(currentWeather.relative_humidity_2m),
            weatherCode: currentWeather.weather_code,
            weatherLabel: getWeatherLabel(currentWeather.weather_code, language),
            windSpeed: roundValue(currentWeather.wind_speed_10m),
            isDay: Boolean(currentWeather.is_day),
            sunrise: dailyWeather.sunrise?.[0] || null,
            sunset: dailyWeather.sunset?.[0] || null,
            aqi: roundValue(currentAir.european_aqi),
            aqiCategory: getAqiCategory(currentAir.european_aqi, language),
            aqiSeverity: getAqiSeverity(currentAir.european_aqi)
        },
        forecast,
        pollutants
    };
}
