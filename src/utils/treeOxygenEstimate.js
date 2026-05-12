const SPECIES_OXYGEN_PROFILES = {
  sycamore: {
    leafAreaHighM2: 980,
    photosynthesisStrength: 1.08,
    deciduous: true
  },
  weeping_beech: {
    leafAreaHighM2: 860,
    photosynthesisStrength: 0.98,
    deciduous: true
  },
  Caucasian_wingnut: {
    leafAreaHighM2: 940,
    photosynthesisStrength: 1.05,
    deciduous: true
  },
  Persian_ironwood: {
    leafAreaHighM2: 680,
    photosynthesisStrength: 0.82,
    deciduous: true
  },
  Japanese_cherries: {
    leafAreaHighM2: 540,
    photosynthesisStrength: 0.74,
    deciduous: true
  },
  ginkgo: {
    leafAreaHighM2: 720,
    photosynthesisStrength: 0.88,
    deciduous: true
  }
};

const IDEAL_OXYGEN_GRAMS_PER_M2_PER_HOUR = 0.46;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSeasonalFactor(date, isDeciduous) {
  if (!isDeciduous) {
    return 1;
  }

  const month = date.getMonth();

  if (month === 11 || month === 0 || month === 1) {
    return 0.04;
  }

  if (month === 2) {
    return 0.18;
  }

  if (month === 3) {
    return 0.45;
  }

  if (month === 4) {
    return 0.78;
  }

  if (month >= 5 && month <= 7) {
    return 1;
  }

  if (month === 8) {
    return 0.84;
  }

  if (month === 9) {
    return 0.58;
  }

  return 0.26;
}

function getDaylightFactor(now, sunriseIso, sunsetIso) {
  if (!sunriseIso || !sunsetIso) {
    return 0.7;
  }

  const sunrise = new Date(sunriseIso);
  const sunset = new Date(sunsetIso);
  const daylightDuration = sunset.getTime() - sunrise.getTime();

  if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime()) || daylightDuration <= 0) {
    return 0.7;
  }

  const currentTime = now.getTime();

  if (currentTime <= sunrise.getTime() || currentTime >= sunset.getTime()) {
    return 0.02;
  }

  const daylightProgress = (currentTime - sunrise.getTime()) / daylightDuration;
  const solarCurve = Math.sin(Math.PI * daylightProgress);
  return clamp(0.25 + 0.95 * solarCurve, 0.25, 1.2);
}

function getWeatherFactor(weatherCode) {
  if (weatherCode === 0) return 1;
  if (weatherCode === 1) return 0.92;
  if (weatherCode === 2) return 0.8;
  if (weatherCode === 3) return 0.62;
  if (weatherCode === 45 || weatherCode === 48) return 0.42;
  if (weatherCode >= 51 && weatherCode <= 67) return 0.48;
  if (weatherCode >= 71 && weatherCode <= 77) return 0.34;
  if (weatherCode >= 80 && weatherCode <= 86) return 0.4;
  if (weatherCode >= 95) return 0.24;
  return 0.68;
}

function getTemperatureFactor(temperatureCelsius) {
  if (temperatureCelsius == null) {
    return 0.9;
  }

  const optimumTemperature = 21;
  const distanceFromOptimum = Math.abs(temperatureCelsius - optimumTemperature);
  return clamp(1 - distanceFromOptimum * 0.025, 0.34, 1);
}

function getProfile(speciesId) {
  return SPECIES_OXYGEN_PROFILES[speciesId] || {
    leafAreaHighM2: 700,
    photosynthesisStrength: 0.85,
    deciduous: true
  };
}

export function estimateTreeOxygenForWalk({
  speciesId,
  walkingTimeInMinutes,
  weatherCode,
  temperature,
  sunrise,
  sunset,
  currentTime
}) {
  if (!walkingTimeInMinutes || walkingTimeInMinutes <= 0) {
    return null;
  }

  const profile = getProfile(speciesId);
  const currentDate = currentTime ? new Date(currentTime) : new Date();
  const seasonalFactor = getSeasonalFactor(currentDate, profile.deciduous);
  const daylightFactor = getDaylightFactor(currentDate, sunrise, sunset);
  const weatherFactor = getWeatherFactor(weatherCode);
  const temperatureFactor = getTemperatureFactor(temperature);

  const gramsPerHourIdeal =
    profile.leafAreaHighM2 *
    IDEAL_OXYGEN_GRAMS_PER_M2_PER_HOUR *
    profile.photosynthesisStrength;

  const gramsPerHour =
    gramsPerHourIdeal *
    seasonalFactor *
    daylightFactor *
    weatherFactor *
    temperatureFactor;

  const gramsDuringWalk = Math.max(0, gramsPerHour * (walkingTimeInMinutes / 60));

  return {
    gramsDuringWalk,
    gramsPerHour,
    gramsPerHourIdeal,
    profile,
    walkingTimeInMinutes,
    currentDate,
    factors: {
      seasonalFactor,
      daylightFactor,
      weatherFactor,
      temperatureFactor
    }
  };
}
