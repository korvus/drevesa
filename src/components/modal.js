import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import trees from '../datas/datas.json';
import { PinContext, Text } from '../store';
import carteExplication from '../img/carteExplication.png';
import herbierOuvert from '../img/herbierOuvert.png';
import herbierFerme from '../img/herbierFerme.png';
import treasure from '../img/treasure.png';
import speciesDetails from '../datas/speciesDetails.js';
import treeAnecdotes, { getLocalizedTreeAnecdote, getRandomTreeAnecdote } from '../datas/treeAnecdotes.js';
import { fetchLjubljanaCityInfo } from '../utils/ljubljanaCityInfo.js';
import { estimateTreeOxygenForWalk } from '../utils/treeOxygenEstimate.js';
import reward2019 from '../img/rewards/reward2019.png';
import reward2020 from '../img/rewards/reward2020.png';
import reward2021 from '../img/rewards/reward2021.png';
import reward2022 from '../img/rewards/reward2022.png';
import reward2023 from '../img/rewards/reward2023.png';
import reward2024 from '../img/rewards/reward2024.png';

const LJUBLJANA_TREES_SOURCE_URL = 'https://www.ljubljana.si/sl/aktualno/novice/v-ljubljani-letos-izbiramo-drevored-leta';
const rewardImages = {
    2019: reward2019,
    2020: reward2020,
    2021: reward2021,
    2022: reward2022,
    2023: reward2023,
    2024: reward2024,
};

const TREE_LINED_YEAR_IDS = new Set(['2023']);

function WeatherGlyph({ weatherCode }) {
    let icon = '\u2601';

    if (weatherCode === 0 || weatherCode === 1) {
        icon = '\u2600';
    } else if (weatherCode === 2) {
        icon = '\u26C5';
    } else if (weatherCode === 3 || weatherCode === 45 || weatherCode === 48) {
        icon = '\u2601';
    } else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
        icon = '\u2614';
    } else if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
        icon = '\u2744';
    } else if (weatherCode >= 95) {
        icon = '\u26A1';
    }

    return <span className="cityInfoWeatherGlyph" aria-hidden="true">{icon}</span>;
}

function OxygenIcon() {
    return (
        <svg className="oxygenIcon" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
            <path d="m228.7,129.4c-54.6,0-98.9,44.3-98.9,98.9s44.3,98.9 98.9,98.9 98.9-44.3 98.9-98.9-44.3-98.9-98.9-98.9zm0,162.7c-35.2,0-63.8-28.6-63.8-63.8s28.6-63.8 63.8-63.8 63.8,28.6 63.8,63.8-28.5,63.8-63.8,63.8z" />
            <path d="M398.3,11H113.7C57.1,11,11,57.1,11,113.7v284.6C11,454.9,57.1,501,113.7,501h284.6c56.6,0,102.7-46.1,102.7-102.7V113.7C501,57.1,454.9,11,398.3,11z M460.2,398.3c0,34.1-27.8,61.9-61.9,61.9H113.7c-34.1,0-61.9-27.8-61.9-61.9V113.7c0-34.1,27.8-61.9,61.9-61.9h284.6c34.1,0,61.9,27.8,61.9,61.9V398.3z" />
            <path d="m363.8,349.4c6.1-6.3 10.2-11.5 12.4-15.5 2.2-4 3.4-8.3 3.4-12.7 0-8.1-2.8-14.5-8.4-19.2-5.6-4.7-12.1-7-19.5-7-7.4,0-13.5,1.6-18.3,4.8-4.8,3.2-9.2,7.9-13.2,14.1l15.3,9.1c4.8-7.7 9.9-11.5 15.3-11.5 2.9,0 5.4,1 7.2,2.9 1.9,1.9 2.8,4.3 2.8,7.2 0,2.9-1.1,5.8-3.3,8.9-2.2,3.1-5.8,7.2-10.8,12.3l-25.1,25.7v14.2h60.4v-17.2h-33.8l15.6-16.1z" />
        </svg>
    );
}

const DONATION_BUTTON_CONFIG = {
    recipientAddress: 'ertelsimonu.eth',
    color: '#178040',
    size: 'md',
    borderRadius: 'md'
};

function DonationButtonEmbed({ dictionary }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const sizeClassName = `donationEmbed__button donationEmbed__button--${DONATION_BUTTON_CONFIG.size || 'md'}`;
    const radiusClassName = `donationEmbed__button donationEmbed__button--radius-${DONATION_BUTTON_CONFIG.borderRadius || 'md'}`;
    const donationUrl = `https://fundhog.bunnylabs.dev/${encodeURIComponent(DONATION_BUTTON_CONFIG.recipientAddress)}`;
    const buttonLabel = dictionary.donationCryptoButton || 'Buy me a coffee with ETH';
    const closeLabel = dictionary.donationClose || 'Close donation window';

    return (
        <>
            <div className="donationEmbed">
                <button
                    type="button"
                    className={`${sizeClassName} ${radiusClassName}`}
                    style={{ backgroundColor: DONATION_BUTTON_CONFIG.color }}
                    onClick={() => setIsModalOpen(true)}
                >
                    {buttonLabel}
                </button>
            </div>
            {isModalOpen && (
                <div
                    className="donationEmbed__overlay"
                    onClick={() => setIsModalOpen(false)}
                    role="presentation"
                >
                    <div
                        className="donationEmbed__dialog"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={buttonLabel}
                    >
                        <button
                            type="button"
                            className="donationEmbed__close"
                            onClick={() => setIsModalOpen(false)}
                            aria-label={closeLabel}
                        >
                            {'\u00D7'}
                        </button>
                        <iframe
                            className="donationEmbed__iframe"
                            src={donationUrl}
                            title={buttonLabel}
                            loading="lazy"
                        />
                    </div>
                </div>
            )}
        </>
    );
}

function BuyMeACoffeeEmbed({ dictionary }) {
    const buttonLabel = dictionary.donationClassicButton || 'Buy me a coffee with regular money';

    return (
        <div className="donationEmbed donationEmbed--bmc">
            <a
                className="donationEmbed__button donationEmbed__button--sm donationEmbed__button--radius-md donationEmbed__button--link"
                href="https://buymeacoffee.com/ertelsimonu"
                target="_blank"
                rel="noreferrer"
                style={{ backgroundColor: '#178040' }}
            >
                {buttonLabel}
            </a>
        </div>
    );
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getDaylightSampleFactorAtHour(baseDate, hour, sunriseIso, sunsetIso) {
    if (!baseDate) {
        return 0.7;
    }

    const sampleDate = new Date(baseDate);
    sampleDate.setHours(hour, 0, 0, 0);

    if (!sunriseIso || !sunsetIso) {
        return 0.7;
    }

    const sunrise = new Date(sunriseIso);
    const sunset = new Date(sunsetIso);
    const daylightDuration = sunset.getTime() - sunrise.getTime();

    if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime()) || daylightDuration <= 0) {
        return 0.7;
    }

    const currentTime = sampleDate.getTime();

    if (currentTime <= sunrise.getTime() || currentTime >= sunset.getTime()) {
        return 0.02;
    }

    const daylightProgress = (currentTime - sunrise.getTime()) / daylightDuration;
    const solarCurve = Math.sin(Math.PI * daylightProgress);
    return clamp(0.25 + 0.95 * solarCurve, 0.25, 1.2);
}

function getSeasonSampleFactor(month) {
    if (month === 11 || month === 0 || month === 1) {
        return 0.04;
    }

    if (month >= 2 && month <= 4) {
        return 0.78;
    }

    if (month >= 5 && month <= 7) {
        return 1;
    }

    return 0.58;
}

function getTemperatureChartFactor(temperatureCelsius) {
    if (temperatureCelsius == null) {
        return 0.75;
    }

    const optimumTemperature = 21;
    const colderSpan = optimumTemperature - (-10);
    const warmerSpan = 40 - optimumTemperature;
    const distanceFromOptimum = temperatureCelsius <= optimumTemperature
        ? (optimumTemperature - temperatureCelsius) / colderSpan
        : (temperatureCelsius - optimumTemperature) / warmerSpan;
    const closeness = clamp(1 - distanceFromOptimum, 0, 1);
    const smoothBell = closeness * closeness * (3 - (2 * closeness));
    return 0.34 + (0.66 * smoothBell);
}

function buildLineSvgPath(points) {
    if (!points.length) {
        return '';
    }

    return points.reduce((path, point, index) => (
        `${path}${index === 0 ? 'M' : ' L'} ${point.xPercent} ${point.yPercent}`
    ), '');
}

const Modalcontent = () => {
    const { setDm, modalContent, locateNearestTree, unlockEveryTree, resetUnlockedPassport, recentlyUnlockedTreeId, selectedSpeciesId, oxygenInfoContext, openSpeciesModal, openOxygenInfoModal, dictionary, userLanguage } = useContext(PinContext);
    const unlockedTree = recentlyUnlockedTreeId && trees[recentlyUnlockedTreeId] ? trees[recentlyUnlockedTreeId][0] : null;
    const unlockedReward = recentlyUnlockedTreeId ? rewardImages[recentlyUnlockedTreeId] : null;
    const selectedSpecies = selectedSpeciesId ? speciesDetails[selectedSpeciesId] : null;
    const unlockedSpecies = unlockedTree ? speciesDetails[unlockedTree.name] : null;
    const randomTreeAnecdote = useMemo(() => {
        if (modalContent !== 'species' || !selectedSpeciesId) {
            return null;
        }

        return getRandomTreeAnecdote(userLanguage);
    }, [modalContent, selectedSpeciesId, userLanguage]);
    const localizedTreeAnecdotes = useMemo(() => {
        if (modalContent !== 'treasure') {
            return [];
        }

        return treeAnecdotes.map((anecdote) => getLocalizedTreeAnecdote(anecdote, userLanguage));
    }, [modalContent, userLanguage]);
    const isTreeLinedYearUnlocked = TREE_LINED_YEAR_IDS.has(recentlyUnlockedTreeId);
    const [cityInfoState, setCityInfoState] = useState({
        status: 'idle',
        data: null
    });
    const [unlockedTreeEnvironment, setUnlockedTreeEnvironment] = useState({
        status: 'idle',
        data: null
    });
    const [isPollutionHelpOpen, setIsPollutionHelpOpen] = useState(false);
    const [activePollutantHelp, setActivePollutantHelp] = useState('');
    const handleIntroStart = useCallback(() => {
        setDm(false);

        // Let the mobile viewport settle after closing the intro modal
        // before triggering map pan and popup opening.
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                locateNearestTree();
            });
        });
    }, [locateNearestTree, setDm]);
    const unlockedTreeOxygenPerHour = useMemo(() => {
        if (!unlockedTree || !unlockedTreeEnvironment.data?.current) {
            return null;
        }

        const estimate = estimateTreeOxygenForWalk({
            speciesId: unlockedTree.name,
            walkingTimeInMinutes: 60,
            weatherCode: unlockedTreeEnvironment.data.current.weatherCode,
            temperature: unlockedTreeEnvironment.data.current.temperature,
            sunrise: unlockedTreeEnvironment.data.current.sunrise,
            sunset: unlockedTreeEnvironment.data.current.sunset,
            currentTime: unlockedTreeEnvironment.data.current.time
        });

        if (!estimate) {
            return null;
        }

        const formatter = new Intl.NumberFormat(
            userLanguage === 'sl' ? 'sl-SI' : userLanguage === 'fr' ? 'fr-FR' : 'en-GB',
            { maximumFractionDigits: 0 }
        );

        return formatter.format(Math.round(estimate.gramsPerHour));
    }, [unlockedTree, unlockedTreeEnvironment.data, userLanguage]);
    const oxygenInfoEstimate = useMemo(() => {
        if (!oxygenInfoContext) {
            return null;
        }

        return estimateTreeOxygenForWalk({
            speciesId: oxygenInfoContext.speciesId,
            walkingTimeInMinutes: oxygenInfoContext.walkingTimeInMinutes,
            weatherCode: oxygenInfoContext.weatherCode,
            temperature: oxygenInfoContext.temperature,
            sunrise: oxygenInfoContext.sunrise,
            sunset: oxygenInfoContext.sunset,
            currentTime: oxygenInfoContext.currentTime
        });
    }, [oxygenInfoContext]);
    const oxygenInfoNumberFormatter = useMemo(() => (
        new Intl.NumberFormat(
            userLanguage === 'sl' ? 'sl-SI' : userLanguage === 'fr' ? 'fr-FR' : 'en-GB',
            { maximumFractionDigits: 0 }
        )
    ), [userLanguage]);
    const oxygenInfoFactorFormatter = useMemo(() => (
        new Intl.NumberFormat(
            userLanguage === 'sl' ? 'sl-SI' : userLanguage === 'fr' ? 'fr-FR' : 'en-GB',
            { maximumFractionDigits: 2 }
        )
    ), [userLanguage]);
    const oxygenInfoAccordions = useMemo(() => {
        if (!oxygenInfoEstimate) {
            return [];
        }

        const sections = [
            {
                titleTid: 'oxygenInfoLeafArea',
                bodyTid: 'oxygenInfoLeafAreaBody',
                value: oxygenInfoEstimate.profile.leafAreaHighM2,
                min: 540,
                max: 980,
                formatValue: (value) => `${oxygenInfoNumberFormatter.format(Math.round(value))} m\u00B2`,
                minTid: 'oxygenInfoLeafAreaMin',
                maxTid: 'oxygenInfoLeafAreaMax'
            },
            {
                titleTid: 'oxygenInfoSpeciesStrength',
                bodyTid: 'oxygenInfoSpeciesStrengthBody',
                value: oxygenInfoEstimate.profile.photosynthesisStrength,
                min: 0.74,
                max: 1.08,
                formatValue: (value) => oxygenInfoFactorFormatter.format(value),
                minTid: 'oxygenInfoSpeciesStrengthMin',
                maxTid: 'oxygenInfoSpeciesStrengthMax'
            },
            {
                titleTid: 'oxygenInfoSeasonFactor',
                bodyTid: 'oxygenInfoSeasonFactorBody',
                value: oxygenInfoEstimate.factors.seasonalFactor,
                min: 0.04,
                max: 1,
                formatValue: (value) => oxygenInfoFactorFormatter.format(value),
                minTid: 'oxygenInfoSeasonFactorMin',
                maxTid: 'oxygenInfoSeasonFactorMax'
            },
            {
                titleTid: 'oxygenInfoDaylightFactor',
                bodyTid: 'oxygenInfoDaylightFactorBody',
                value: oxygenInfoEstimate.factors.daylightFactor,
                min: 0.02,
                max: 1.2,
                formatValue: (value) => oxygenInfoFactorFormatter.format(value),
                minTid: 'oxygenInfoDaylightFactorMin',
                maxTid: 'oxygenInfoDaylightFactorMax'
            },
            {
                titleTid: 'oxygenInfoWeatherFactor',
                bodyTid: 'oxygenInfoWeatherFactorBody',
                value: oxygenInfoEstimate.factors.weatherFactor,
                min: 0.24,
                max: 1,
                formatValue: (value) => oxygenInfoFactorFormatter.format(value),
                minTid: 'oxygenInfoWeatherFactorMin',
                maxTid: 'oxygenInfoWeatherFactorMax'
            },
            {
                titleTid: 'oxygenInfoTemperatureFactor',
                bodyTid: 'oxygenInfoTemperatureFactorBody',
                value: oxygenInfoEstimate.factors.temperatureFactor,
                min: 0.34,
                max: 1,
                formatValue: (value) => oxygenInfoFactorFormatter.format(value),
                minTid: 'oxygenInfoTemperatureFactorMin',
                maxTid: 'oxygenInfoTemperatureFactorMax'
            }
        ];

        return sections.map((section) => ({
            ...section,
            markerPercent: clamp(((section.value - section.min) / (section.max - section.min)) * 100, 0, 100)
        }));
    }, [oxygenInfoEstimate, oxygenInfoFactorFormatter, oxygenInfoNumberFormatter]);
    const oxygenInfoDaylightSamples = useMemo(() => {
        if (!oxygenInfoContext?.currentTime) {
            return [];
        }

        const baseDate = new Date(oxygenInfoContext.currentTime);
        return Array.from({ length: 24 }, (_, hour) => ({
            hour,
            label: `${String(hour).padStart(2, '0')}:00`,
            shortLabel: `${String(hour).padStart(2, '0')}`,
            value: getDaylightSampleFactorAtHour(baseDate, hour, oxygenInfoContext.sunrise, oxygenInfoContext.sunset),
            heightPercent: clamp((getDaylightSampleFactorAtHour(baseDate, hour, oxygenInfoContext.sunrise, oxygenInfoContext.sunset) / 1.2) * 100, 2, 100),
            showLabel: hour % 3 === 0,
            isCurrent: hour === baseDate.getHours()
        }));
    }, [oxygenInfoContext]);
    const oxygenInfoDaylightExtremes = useMemo(() => {
        if (!oxygenInfoDaylightSamples.length) {
            return { minIndex: -1, maxIndex: -1 };
        }

        let minIndex = 0;
        let maxIndex = 0;

        oxygenInfoDaylightSamples.forEach((sample, index) => {
            if (sample.value < oxygenInfoDaylightSamples[minIndex].value) {
                minIndex = index;
            }

            if (sample.value > oxygenInfoDaylightSamples[maxIndex].value) {
                maxIndex = index;
            }
        });

        return { minIndex, maxIndex };
    }, [oxygenInfoDaylightSamples]);
    const oxygenInfoSeasonSamples = useMemo(() => {
        if (!oxygenInfoEstimate?.currentDate) {
            return [];
        }

        const currentMonth = oxygenInfoEstimate.currentDate.getMonth();
        const seasonDefinitions = [
            { key: 'winter', labelTid: 'oxygenInfoSeasonWinter', months: [11, 0, 1], value: getSeasonSampleFactor(0) },
            { key: 'spring', labelTid: 'oxygenInfoSeasonSpring', months: [2, 3, 4], value: getSeasonSampleFactor(3) },
            { key: 'summer', labelTid: 'oxygenInfoSeasonSummer', months: [5, 6, 7], value: getSeasonSampleFactor(6) },
            { key: 'autumn', labelTid: 'oxygenInfoSeasonAutumn', months: [8, 9, 10], value: getSeasonSampleFactor(9) }
        ];

        return seasonDefinitions.map((season) => ({
            ...season,
            isCurrent: season.months.includes(currentMonth),
            heightPercent: clamp(season.value * 100, 4, 100)
        }));
    }, [oxygenInfoEstimate]);
    const oxygenInfoSeasonExtremes = useMemo(() => {
        if (!oxygenInfoSeasonSamples.length) {
            return { minIndex: -1, maxIndex: -1 };
        }

        let minIndex = 0;
        let maxIndex = 0;

        oxygenInfoSeasonSamples.forEach((sample, index) => {
            if (sample.value < oxygenInfoSeasonSamples[minIndex].value) {
                minIndex = index;
            }

            if (sample.value > oxygenInfoSeasonSamples[maxIndex].value) {
                maxIndex = index;
            }
        });

        return { minIndex, maxIndex };
    }, [oxygenInfoSeasonSamples]);
    const oxygenInfoTemperatureSamples = useMemo(() => (
        Array.from({ length: 51 }, (_, index) => {
            const temperature = -10 + index;
            const value = getTemperatureChartFactor(temperature);
            return {
                temperature,
                value,
                xPercent: clamp(((temperature + 10) / 50) * 100, 0, 100),
                yPercent: clamp(100 - (((value - 0.34) / (1 - 0.34)) * 100), 0, 100),
                showLabel: temperature % 10 === 0
            };
        })
    ), []);
    const oxygenInfoTemperaturePath = useMemo(() => (
        oxygenInfoTemperatureSamples
            .map((sample) => ({
                xPercent: sample.xPercent,
                yPercent: sample.yPercent
            }))
    ), [oxygenInfoTemperatureSamples]);
    const oxygenInfoTemperaturePathD = useMemo(() => (
        buildLineSvgPath(oxygenInfoTemperaturePath)
    ), [oxygenInfoTemperaturePath]);
    const oxygenInfoCurrentTemperaturePoint = useMemo(() => {
        if (oxygenInfoContext?.temperature == null) {
            return null;
        }

        const temperature = clamp(oxygenInfoContext.temperature, -10, 40);
        const value = getTemperatureChartFactor(temperature);

        return {
            temperature,
            value,
            xPercent: clamp(((temperature + 10) / 50) * 100, 0, 100),
            yPercent: clamp(100 - (((value - 0.34) / (1 - 0.34)) * 100), 0, 100)
        };
    }, [oxygenInfoContext]);

    useEffect(() => {
        if (modalContent !== 'cityInfo') {
            return undefined;
        }

        const controller = new AbortController();

        async function loadCityInfo() {
            setCityInfoState({ status: 'loading', data: null });

            try {
                setCityInfoState({
                    status: 'ready',
                    data: await fetchLjubljanaCityInfo(userLanguage, controller.signal)
                });
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }

                setCityInfoState({ status: 'error', data: null });
            }
        }

        loadCityInfo();

        return () => controller.abort();
    }, [modalContent, userLanguage]);

    useEffect(() => {
        if (!unlockedTree || (modalContent !== 'treeUnlocked' && modalContent !== 'gameVictory')) {
            return undefined;
        }

        const controller = new AbortController();

        fetchLjubljanaCityInfo(userLanguage, controller.signal)
            .then((data) => {
                setUnlockedTreeEnvironment({
                    status: 'ready',
                    data
                });
            })
            .catch((error) => {
                if (error.name === 'AbortError') {
                    return;
                }

                setUnlockedTreeEnvironment({
                    status: 'error',
                    data: null
                });
            });

        return () => controller.abort();
    }, [modalContent, unlockedTree, userLanguage]);

    return (
        <div className="innerModal">
            <div title="Echap" onClick={() => setDm(false)} className="wrapperClose">
                <div className="close"></div>
            </div>
            <div className="contentModal">
                {modalContent === "about" &&
                    <>
                        <div className="aboutCopy">
                            <h2><Text tid="About" /></h2>
                            <div>
                                <Text tid="goalContent" />
                            </div>
                            <p className="aboutSourceLink">
                                <Text tid="aboutSourceLead" />{' '}
                                <a
                                    className="externalLink"
                                    rel="noreferrer"
                                    target="_blank"
                                    href={LJUBLJANA_TREES_SOURCE_URL}
                                    lang="sl"
                                    hrefLang="sl"
                                >
                                    <Text as="span" tid="aboutSourceLinkLabel" />
                                </a>{' '}
                                <Text tid="aboutSourceNote" />
                            </p>
                            <div className="gameActions">
                                <button type="button" className="gameActionButton" onClick={unlockEveryTree}>
                                    <Text tid="gameUnlockAll" />
                                </button>
                                <button type="button" className="gameActionButton gameActionButton--secondary" onClick={resetUnlockedPassport}>
                                    <Text tid="gameResetProgress" />
                                </button>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "contact" &&
                    <>
                        <div className="contactCopy">
                            <h2><Text tid="contact" /></h2>
                            <div>
                                <Text tid="links" />
                            </div>
                            <div className="contactDonation">
                                <div className="contactDonation__actions">
                                    <DonationButtonEmbed dictionary={dictionary} />
                                    <BuyMeACoffeeEmbed dictionary={dictionary} />
                                </div>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "tooFar" &&
                    <>
                        <h2><Text tid="nearestTreeTooFarTitle" /></h2>
                        <div>
                            <Text tid="nearestTreeTooFar" />
                        </div>
                    </>
                }
                {modalContent === "cityInfo" &&
                    <>
                        <div className="cityInfoCopy">
                            <h2><Text tid="cityInfoTitle" /></h2>
                            <p className="cityInfoLead"><Text tid="cityInfoLead" /></p>
                            {cityInfoState.status === 'loading' && (
                                <p><Text tid="cityInfoLoading" /></p>
                            )}
                            {cityInfoState.status === 'error' && (
                                <p><Text tid="cityInfoError" /></p>
                            )}
                            {cityInfoState.status === 'ready' && cityInfoState.data && (
                                <>
                                    <section className="cityInfoNowPanel">
                                        <article className="cityInfoNowRow cityInfoNowRow--hero">
                                            <div className="cityInfoHero__main">
                                                <div className="cityInfoHero__temperature">{cityInfoState.data.current.temperature} {'\u00B0'}C</div>
                                                <div className="cityInfoHero__weather">
                                                    <WeatherGlyph weatherCode={cityInfoState.data.current.weatherCode} />
                                                    <span>{cityInfoState.data.current.weatherLabel}</span>
                                                </div>
                                            </div>
                                        </article>
                                        <article className={`cityInfoNowRow cityInfoNowRow--aqi cityInfoAqiBadge--${cityInfoState.data.current.aqiSeverity}`}>
                                            <div className="cityInfoNowRow__head">
                                                <span className="cityInfoAqiBadge__label"><Text tid="cityInfoPollution" /></span>
                                                <button
                                                    type="button"
                                                    className="cityInfoHelpButton"
                                                    onClick={() => setIsPollutionHelpOpen((current) => !current)}
                                                    aria-label={dictionary.cityInfoPollutionHelpCta || 'About the pollution index'}
                                                    title={dictionary.cityInfoPollutionHelpCta || 'About the pollution index'}
                                                >
                                                    ?
                                                </button>
                                            </div>
                                            <strong>{cityInfoState.data.current.aqi}</strong>
                                            <span className="cityInfoAqiBadge__meta">{cityInfoState.data.current.aqiCategory}</span>
                                            {isPollutionHelpOpen && (
                                                <div className="cityInfoHelpTooltip">
                                                    <Text tid="cityInfoPollutionHelpBody" />
                                                </div>
                                            )}
                                        </article>
                                        <article className="cityInfoNowRow">
                                            <span className="cityInfoQuickCard__label"><Text tid="cityInfoHumidity" /></span>
                                            <strong>{cityInfoState.data.current.humidity} %</strong>
                                        </article>
                                        <article className="cityInfoNowRow">
                                            <span className="cityInfoQuickCard__label"><Text tid="cityInfoWind" /></span>
                                            <strong>{cityInfoState.data.current.windSpeed} km/h</strong>
                                        </article>
                                    </section>

                                    <details className="cityInfoAccordion" open>
                                        <summary>
                                            <span>
                                                <strong><Text tid="cityInfoForecastTitle" /></strong>
                                                <small><Text tid="cityInfoForecastLead" /></small>
                                            </span>
                                        </summary>
                                        <div className="cityInfoAccordion__content">
                                            <div className="cityInfoForecastTable">
                                                <div className="cityInfoForecastTable__head">
                                                    <span><Text tid="cityInfoForecastDayCol" /></span>
                                                    <span><Text tid="cityInfoForecastAqiCol" /></span>
                                                    <span><Text tid="cityInfoForecastTempCol" /></span>
                                                    <span><Text tid="cityInfoForecastWindCol" /></span>
                                                    <span><Text tid="cityInfoForecastHumidityCol" /></span>
                                                </div>
                                                {cityInfoState.data.forecast.map((day) => (
                                                    <article key={day.date} className="cityInfoForecastRow">
                                                        <div className="cityInfoForecastRow__day">
                                                            <span>{day.dayLabel}</span>
                                                            <WeatherGlyph weatherCode={day.weatherCode} />
                                                        </div>
                                                        <div className={`cityInfoForecastRow__aqi cityInfoAqiBadge--${day.aqiSeverity}`}>
                                                            {day.aqi}
                                                        </div>
                                                        <div className="cityInfoForecastRow__temps">
                                                            <strong>{day.temperatureMax}{'\u00B0'}</strong>
                                                            <span>{day.temperatureMin}{'\u00B0'}</span>
                                                        </div>
                                                        <div className="cityInfoForecastRow__meta">
                                                            <span>{day.windSpeed} km/h</span>
                                                        </div>
                                                        <div className="cityInfoForecastRow__humidity">
                                                            <span>{day.humidity} %</span>
                                                        </div>
                                                    </article>
                                                ))} 
                                            </div>
                                        </div>
                                    </details>

                                    <details className="cityInfoAccordion" open>
                                        <summary>
                                            <span>
                                                <strong><Text tid="cityInfoPollutantsTitle" /></strong>
                                                <small><Text tid="cityInfoPollutantsLead" /></small>
                                            </span>
                                        </summary>
                                        <div className="cityInfoAccordion__content">
                                            <div className="cityInfoPollutantsGrid">
                                                {cityInfoState.data.pollutants.map((pollutant) => (
                                                    <article key={pollutant.key} className="cityInfoPollutantCard">
                                                        <div className="cityInfoPollutantCard__head">
                                                            <div className="cityInfoPollutantCard__title">
                                                                <strong><Text tid={pollutant.labelKey} /></strong>
                                                                <button
                                                                    type="button"
                                                                    className="cityInfoHelpButton cityInfoHelpButton--small"
                                                                    onClick={() => setActivePollutantHelp((current) => current === pollutant.key ? '' : pollutant.key)}
                                                                    aria-label={dictionary.cityInfoPollutantHelpCta || 'About this pollutant'}
                                                                    title={dictionary.cityInfoPollutantHelpCta || 'About this pollutant'}
                                                                >
                                                                    ?
                                                                </button>
                                                            </div>
                                                            <span className={`cityInfoPollutantCard__status cityInfoAqiBadge--${pollutant.aqiSeverity}`}>{pollutant.aqiCategory}</span>
                                                        </div>
                                                        <div className="cityInfoPollutantCard__value">
                                                            {pollutant.value} {pollutant.unit}
                                                        </div>
                                                        <div className="cityInfoPollutantCard__bar">
                                                            <span
                                                                className={`cityInfoPollutantCard__barFill cityInfoPollutantCard__barFill--${pollutant.aqiSeverity}`}
                                                                style={{ width: pollutant.barWidth }}
                                                            />
                                                        </div>
                                                        {activePollutantHelp === pollutant.key && (
                                                            <div className="cityInfoHelpTooltip cityInfoHelpTooltip--pollutant">
                                                                <Text tid={`${pollutant.labelKey}Help`} />
                                                            </div>
                                                        )}
                                                    </article>
                                                ))}
                                            </div>
                                        </div>
                                    </details>
                                </>
                            )}
                            <p className="cityInfoSource">
                                <Text tid="cityInfoSource" />
                            </p>
                        </div>
                    </>
                }
                {modalContent === "intro" &&
                    <>
                        <div className="introCopy">
                            <h2><Text tid="introModalTitle" /></h2>
                            <div>
                                <Text tid="introModalContent" />
                            </div>
                            <div className="introGameLead">
                                <Text tid="introModalGameLead" />
                            </div>
                            <div className="introGameIllustration">
                                <img src={carteExplication} alt="" />
                            </div>
                            <div className="introGameWalk">
                                <Text tid="introModalWalkLead" />
                            </div>
                            <div className="gameActions">
                                <button type="button" className="gameActionButton" onClick={handleIntroStart}>
                                    <Text tid="introModalCta" />
                                </button>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "treeUnlocked" && unlockedTree &&
                    <>
                        <div className="unlockCopy">
                            {unlockedReward &&
                                <div className="unlockReward">
                                    <img src={unlockedReward} alt="" />
                                </div>
                            }
                            <header>
                                <h2><Text tid="gameUnlockedTitle" /></h2>
                                <div>
                                    <Text tid={isTreeLinedYearUnlocked ? "gameUnlockedLead2023" : "gameUnlockedLead"} /> <strong>{recentlyUnlockedTreeId}</strong>.
                                </div>
                            </header>
                            <div className="unlockMeta">
                                <p>
                                    <strong><Text tid="gameUnlockedYearLabel" /></strong> {recentlyUnlockedTreeId}
                                </p>
                                <p>
                                    <strong><Text tid="essence" /> : </strong>
                                    {unlockedSpecies ? (
                                        <button
                                            type="button"
                                            className="speciesTrigger"
                                            onClick={() => openSpeciesModal(unlockedTree.name)}
                                            title={dictionary.speciesModalTriggerHint}
                                            aria-label={dictionary.speciesModalTriggerHint}
                                        >
                                            <img className="speciesTriggerIcon" src={herbierFerme} alt="" aria-hidden="true" />
                                            <Text as="span" tid={unlockedSpecies.nameTid} />
                                        </button>
                                    ) : (
                                        <Text as="span" tid={unlockedTree.name} />
                                    )}
                                </p>
                                {unlockedTreeOxygenPerHour && (
                                    <p className="unlockOxygenRow">
                                        <span className="unlockOxygenInfoRow">
                                            <span className="unlockOxygenTag">
                                            <span className="unlockOxygenTag__icon"><OxygenIcon /></span>
                                            <span className="unlockOxygenTag__value">{'\u2243'} {unlockedTreeOxygenPerHour}g O{'\u2082'} / h</span>
                                            </span>
                                            {unlockedTreeEnvironment.data?.current && (
                                                <button
                                                    type="button"
                                                    className="oxygenInfoButton oxygenInfoButton--modal"
                                                    onClick={() => openOxygenInfoModal({
                                                        source: 'tree-unlocked-modal',
                                                        speciesId: unlockedTree.name,
                                                        year: recentlyUnlockedTreeId,
                                                        walkingTimeInMinutes: 60,
                                                        weatherCode: unlockedTreeEnvironment.data.current.weatherCode,
                                                        temperature: unlockedTreeEnvironment.data.current.temperature,
                                                        sunrise: unlockedTreeEnvironment.data.current.sunrise,
                                                        sunset: unlockedTreeEnvironment.data.current.sunset,
                                                        currentTime: unlockedTreeEnvironment.data.current.time
                                                    })}
                                                >
                                                    <Text tid="oxygenInfoAction" />
                                                </button>
                                            )}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                }
                {modalContent === "gameVictory" && unlockedTree &&
                    <>
                        <div className="victoryCopy">
                            {unlockedReward &&
                                <div className="unlockReward unlockReward--victory">
                                    <img src={unlockedReward} alt="" />
                                </div>
                            }
                            <header>
                                <p className="victoryEyebrow"><Text tid="gameVictoryEyebrow" /></p>
                                <h2><Text tid="gameVictoryTitle" /></h2>
                                <div>
                                    <Text tid="gameVictoryLead" />
                                </div>
                            </header>
                            <div className="unlockMeta">
                                <p>
                                    <strong><Text tid="gameUnlockedYearLabel" /></strong> {recentlyUnlockedTreeId}
                                </p>
                                <p>
                                    <strong><Text tid={isTreeLinedYearUnlocked ? "gameVictoryLastDiscoveryLabel" : "gameVictoryLastTreeLabel"} /></strong> {recentlyUnlockedTreeId}
                                </p>
                                <p>
                                    <Text tid="gameVictoryBody" />
                                </p>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "oxygenInfo" && oxygenInfoContext && oxygenInfoEstimate &&
                    <>
                        <div className="oxygenInfoCopy">
                            <div className="oxygenInfoHero">
                                <div className="oxygenInfoHero__icon" aria-hidden="true"><OxygenIcon /></div>
                                <h2><Text tid="oxygenInfoTitle" /></h2>
                            </div>
                            <p className="oxygenInfoLead"><Text tid="oxygenInfoLead" /></p>
                            <div className="oxygenInfoCards">
                                <div className="oxygenInfoCard">
                                    <strong>{oxygenInfoNumberFormatter.format(Math.round(oxygenInfoEstimate.gramsPerHourIdeal))}g O{'\u2082'} / h</strong>
                                    <span><Text tid="oxygenInfoIdealHourly" /></span>
                                </div>
                                <div className="oxygenInfoCard">
                                    <strong>{oxygenInfoNumberFormatter.format(Math.round(oxygenInfoEstimate.gramsPerHour))}g O{'\u2082'} / h</strong>
                                    <span><Text tid="oxygenInfoAdjustedHourly" /></span>
                                </div>
                                <div className="oxygenInfoCard">
                                    <strong>{oxygenInfoNumberFormatter.format(Math.round(oxygenInfoEstimate.gramsDuringWalk))}g O{'\u2082'}</strong>
                                    <span><Text tid="oxygenInfoForDuration" /></span>
                                </div>
                            </div>
                            <p className="oxygenInfoBody"><Text tid="oxygenInfoMethodBody" /></p>
                            <div className="oxygenInfoAccordions">
                                {oxygenInfoAccordions.map((section) => (
                                    <details key={section.titleTid} className="oxygenInfoAccordion">
                                        <summary>
                                            <span className="oxygenInfoAccordion__title"><Text tid={section.titleTid} /></span>
                                            <span className="oxygenInfoAccordion__value">{section.formatValue(section.value)}</span>
                                        </summary>
                                        <div className="oxygenInfoAccordion__body">
                                            <p><Text tid={section.bodyTid} /></p>
                                            {section.titleTid !== 'oxygenInfoLeafArea' && section.titleTid !== 'oxygenInfoDaylightFactor' && section.titleTid !== 'oxygenInfoSeasonFactor' && section.titleTid !== 'oxygenInfoTemperatureFactor' && (
                                                <>
                                                    <div
                                                        className={`oxygenInfoRange${section.titleTid === 'oxygenInfoWeatherFactor' || section.titleTid === 'oxygenInfoSpeciesStrength' ? ' oxygenInfoRange--weather' : ''}`}
                                                        aria-hidden="true"
                                                    >
                                                        <div className="oxygenInfoRange__track"></div>
                                                        <div className="oxygenInfoRange__marker" style={{ left: `${section.markerPercent}%` }}></div>
                                                    </div>
                                                    <div className="oxygenInfoRange__legend">
                                                        <span>
                                                            <Text tid={section.minTid} />
                                                            <strong>{section.formatValue(section.min)}</strong>
                                                        </span>
                                                        <span>
                                                            <Text tid={section.maxTid} />
                                                            <strong>{section.formatValue(section.max)}</strong>
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            {section.titleTid === 'oxygenInfoTemperatureFactor' && oxygenInfoTemperatureSamples.length > 0 && (
                                                <div className="oxygenInfoTemperatureChart">
                                                    <p className="oxygenInfoDaylightChart__title"><Text tid="oxygenInfoTemperatureCurveTitle" /></p>
                                                    <div className="oxygenInfoTemperatureChart__frame" aria-hidden="true">
                                                        <svg
                                                            className="oxygenInfoTemperatureChart__svg"
                                                            viewBox="0 0 100 100"
                                                            preserveAspectRatio="none"
                                                        >
                                                            <line x1="0" y1="100" x2="100" y2="100" className="oxygenInfoTemperatureChart__baseline" />
                                                            <line x1="0" y1="0" x2="100" y2="0" className="oxygenInfoTemperatureChart__guide" />
                                                            <line x1="0" y1="50" x2="100" y2="50" className="oxygenInfoTemperatureChart__guide" />
                                                            <path
                                                                className="oxygenInfoTemperatureChart__line"
                                                                d={oxygenInfoTemperaturePathD}
                                                            />
                                                            {oxygenInfoCurrentTemperaturePoint && (
                                                                <line
                                                                    className="oxygenInfoTemperatureChart__marker"
                                                                    x1={oxygenInfoCurrentTemperaturePoint.xPercent}
                                                                    y1={clamp(oxygenInfoCurrentTemperaturePoint.yPercent - 8, 0, 100)}
                                                                    x2={oxygenInfoCurrentTemperaturePoint.xPercent}
                                                                    y2={clamp(oxygenInfoCurrentTemperaturePoint.yPercent + 8, 0, 100)}
                                                                />
                                                            )}
                                                        </svg>
                                                        {oxygenInfoCurrentTemperaturePoint && (
                                                            <div
                                                                className="oxygenInfoTemperatureChart__annotation"
                                                                style={{
                                                                    left: `${oxygenInfoCurrentTemperaturePoint.xPercent}%`,
                                                                    top: `${oxygenInfoCurrentTemperaturePoint.yPercent}%`
                                                                }}
                                                            >
                                                                <strong>{oxygenInfoNumberFormatter.format(Math.round(oxygenInfoCurrentTemperaturePoint.temperature))}{'\u00B0'}C</strong>
                                                            </div>
                                                        )}
                                                        <div className="oxygenInfoTemperatureChart__labels">
                                                            {oxygenInfoTemperatureSamples.filter((sample) => sample.showLabel).map((sample) => (
                                                                <span key={sample.temperature}>{sample.temperature}{'\u00B0'}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {section.titleTid === 'oxygenInfoSeasonFactor' && oxygenInfoSeasonSamples.length > 0 && (
                                                <div className="oxygenInfoSeasonChart">
                                                    <p className="oxygenInfoDaylightChart__title"><Text tid="oxygenInfoSeasonCurveTitle" /></p>
                                                    <div className="oxygenInfoSeasonChart__bars" aria-hidden="true">
                                                        {oxygenInfoSeasonSamples.map((sample, index) => (
                                                            <div
                                                                key={sample.key}
                                                                className={`oxygenInfoSeasonChart__item${sample.isCurrent ? ' oxygenInfoSeasonChart__item--current' : ''}`}
                                                                title={`${dictionary[sample.labelTid] || sample.key} \u00B7 ${oxygenInfoFactorFormatter.format(sample.value)}`}
                                                            >
                                                                <div className="oxygenInfoSeasonChart__column">
                                                                    <div
                                                                        className={`oxygenInfoSeasonChart__annotation${index === oxygenInfoSeasonExtremes.minIndex ? ' oxygenInfoSeasonChart__annotation--min' : ''}${index === oxygenInfoSeasonExtremes.maxIndex ? ' oxygenInfoSeasonChart__annotation--max' : ''}`}
                                                                        style={{ '--bar-height': `${sample.heightPercent}%` }}
                                                                    >
                                                                        <strong>{section.formatValue(sample.value)}</strong>
                                                                    </div>
                                                                    <div
                                                                        className="oxygenInfoSeasonChart__bar"
                                                                        style={{ height: `${sample.heightPercent}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="oxygenInfoSeasonChart__label"><Text tid={sample.labelTid} /></span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {section.titleTid === 'oxygenInfoDaylightFactor' && oxygenInfoDaylightSamples.length > 0 && (
                                                <div className="oxygenInfoDaylightChart">
                                                    <p className="oxygenInfoDaylightChart__title"><Text tid="oxygenInfoDaylightCurveTitle" /></p>
                                                    <div className="oxygenInfoDaylightChart__bars" aria-hidden="true">
                                                        {oxygenInfoDaylightSamples.map((sample) => (
                                                            <div
                                                                key={sample.hour}
                                                                className={`oxygenInfoDaylightChart__item${sample.isCurrent ? ' oxygenInfoDaylightChart__item--current' : ''}`}
                                                                title={`${sample.label} \u00B7 ${oxygenInfoFactorFormatter.format(sample.value)}`}
                                                            >
                                                                <div className="oxygenInfoDaylightChart__column">
                                                                    {sample.hour === oxygenInfoDaylightExtremes.minIndex && (
                                                                        <div
                                                                            className={`oxygenInfoDaylightChart__annotation oxygenInfoDaylightChart__annotation--min${sample.isCurrent ? ' oxygenInfoDaylightChart__annotation--current' : ''}`}
                                                                            style={{ '--bar-height': `${sample.heightPercent}%` }}
                                                                        >
                                                                            <strong>{section.formatValue(section.min)}</strong>
                                                                        </div>
                                                                    )}
                                                                    {sample.hour === oxygenInfoDaylightExtremes.maxIndex && (
                                                                        <div
                                                                            className={`oxygenInfoDaylightChart__annotation oxygenInfoDaylightChart__annotation--max${sample.isCurrent ? ' oxygenInfoDaylightChart__annotation--current' : ''}`}
                                                                            style={{ '--bar-height': `${sample.heightPercent}%` }}
                                                                        >
                                                                            <strong>{section.formatValue(section.max)}</strong>
                                                                        </div>
                                                                    )}
                                                                    <div
                                                                        className="oxygenInfoDaylightChart__bar"
                                                                        style={{ height: `${sample.heightPercent}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="oxygenInfoDaylightChart__label">{sample.showLabel ? sample.shortLabel : ''}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                ))}
                            </div>
                            <p className="oxygenInfoMeta">
                                <strong><Text tid="oxygenInfoWalkDuration" /></strong> {oxygenInfoNumberFormatter.format(Math.round(oxygenInfoEstimate.walkingTimeInMinutes))} min
                                {oxygenInfoContext.temperature != null ? ` \u00B7 ${dictionary.oxygenInfoTemperatureInput || 'Temperature used'} ${oxygenInfoFactorFormatter.format(oxygenInfoContext.temperature)} \u00B0C` : ''}
                            </p>
                            <p className="oxygenInfoDisclaimer"><Text tid="oxygenInfoDisclaimer" /></p>
                        </div>
                    </>
                }
                {modalContent === "species" && selectedSpecies &&
                    <>
                        <div className="speciesCopy">
                            <div className="speciesIllustration">
                                <img src={herbierOuvert} alt="" />
                            </div>
                            <h2><Text tid={selectedSpecies.nameTid} /></h2>
                            <div className="speciesBody">
                                <Text tid={selectedSpecies.anecdoteTid} />
                            </div>
                            {selectedSpecies.facts && selectedSpecies.facts.length > 0 && (
                                <section className="speciesFactsCard">
                                    <h3><Text tid="speciesFactsTitle" /></h3>
                                    <dl className="speciesFactsList">
                                        {selectedSpecies.facts.map((fact) => (
                                            <div key={fact.labelTid} className="speciesFactsItem">
                                                <dt><Text tid={fact.labelTid} /></dt>
                                                <dd>{fact.value[userLanguage] || fact.value.fr}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </section>
                            )}
                            {randomTreeAnecdote && (
                                <aside className="speciesAnecdoteCard">
                                    <h3><Text tid="speciesTriviaTitle" /></h3>
                                    <p>{randomTreeAnecdote.text}</p>
                                    <a
                                        className="externalLink speciesAnecdoteSource"
                                        rel="noreferrer"
                                        target="_blank"
                                        href={randomTreeAnecdote.sourceUrl}
                                    >
                                        <Text as="span" tid="speciesTriviaSource" />
                                    </a>
                                </aside>
                            )}
                            <div className="speciesLinks">
                                <h3><Text tid="speciesModalLinksTitle" /></h3>
                                <ul>
                                    {selectedSpecies.links.map((link) => (
                                        <li key={link.url}>
                                            <a className="externalLink" rel="noreferrer" target="_blank" href={link.url}>
                                                <Text as="span" tid={link.labelTid} />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "treasure" &&
                    <>
                        <div className="treasureCopy">
                            <div className="treasureHero">
                                <img src={treasure} alt="" />
                            </div>
                            <h2><Text tid="gameTreasureModalTitle" /></h2>
                            <p className="treasureLead"><Text tid="gameTreasureModalLead" /></p>
                            <div className="treasureAnecdotes">
                                {localizedTreeAnecdotes.map((anecdote) => (
                                    <article key={anecdote.id} className="treasureAnecdoteCard">
                                        <p>{anecdote.text}</p>
                                        <a
                                            className="externalLink treasureAnecdoteSource"
                                            rel="noreferrer"
                                            target="_blank"
                                            href={anecdote.sourceUrl}
                                        >
                                            {anecdote.sourceLabel || dictionary.speciesTriviaSource}
                                        </a>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </>
                }
            </div>
        </div>
    );
}

export default Modalcontent;
