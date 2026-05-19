import React, { useContext, useCallback, useState, useEffect } from "react";
import trees from "../datas/datas.json";
import { PinContext, Text } from "../store";
import LanguageSelector from './languageSelector.js';
import badge from '../img/badge.png';
import coupe from '../img/coupe.png';
import treasure from '../img/treasure.png';
import { fetchLjubljanaCityInfo } from '../utils/ljubljanaCityInfo.js';
import { estimateTreeOxygenForWalk } from '../utils/treeOxygenEstimate.js';
import MetaInAppBrowserNotice from './metaInAppBrowserNotice.js';


const EXCLUDED_TREE_YEARS = new Set(['2023']);
const listDate = Object.keys(trees).filter((year) => !EXCLUDED_TREE_YEARS.has(year));
const LJUBLJANA_COORDS = [46.0507666, 14.5047565];
const REFERENCE_HEIGHT_METERS = 1.7;
const ESTIMATED_STRIDE_RATIO = 0.414;
const CALORIES_PER_KM = 52.5;
const CO2_GRAMS_PER_KCAL = 0.39;

function WalkingIcon() {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <circle cx="32" cy="11" r="5" />
            <path d="M32 19v14" />
            <path d="M32 24l-10 8" />
            <path d="M32 24l10 6" />
            <path d="M32 33l-8 17" />
            <path d="M32 33l9 18" />
        </svg>
    );
}

function DistanceIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 16c0-4.4 3.6-8 8-8" />
            <path d="M12 8h7" />
            <path d="M16 4l4 4-4 4" />
            <circle cx="7" cy="17" r="2.4" />
        </svg>
    );
}

function StepsIcon() {
    return (
        <svg className="stepsIcon" viewBox="0 0 259.3 435.88" aria-hidden="true" focusable="false">
            <g transform="translate(-426.35 -339.904)">
                <path d="m315.67 347.53c0 20.503-16.621 37.123-37.123 37.123-20.503 0-37.123-16.621-37.123-37.123 0-20.503 16.621-37.123 37.123-37.123 20.503 0 37.123 16.621 37.123 37.123z" transform="translate(294.11 29.495)" />
                <path d="m516.35 490.41s-30.339 157.53-36.871 168.19c-5.5865 9.1154-49.18 80.642-49.18 80.642-9.3065 15.26-0.48739 26.17 9.3724 31.862 8.3938 4.8456 26.437 3.6458 32.403-6.5301 0 0 48.366-75.267 53.643-91.5 3.6534-11.238 12.143-57.857 12.143-57.857s46.996 48.47 52.143 57.143c6.4876 10.933 18.571 87.143 18.571 87.143 2.8898 13.56 15.822 17.982 29.286 15.714 10.633-1.7908 21.753-8.9851 19.286-22.143 0 0-10.746-88.36-19.286-102.86-10.191-17.302-65-76.429-65-76.429l15.714-70s10.086 20.446 17.143 29.286c8.0255 10.053 58.571 39.286 58.571 39.286 4.6363 3.1097 15.133 1.3962 19.286-6.4286 3.3332-6.2806 3.1763-16.454-4.2857-21.429 0 0-41.655-26.151-51.429-34.286-10.87-9.03-32.86-69.27-32.86-69.27-6.8208-9.3864-16.151-19.742-32.143-20-16.119-0.26028-24.187 8.6196-31.429 13.571 0 0-61.747 45.105-67.857 54.286-6.1469 9.236-17.143 78.571-17.143 78.571-1.7236 7.9 1.3621 14.253 10.714 16.429 11.443 2.662 19.645-4.4634 20.714-10 0 0 7.0508-54.765 12.143-62.857 5.9288-9.4214 26.346-20.521 26.346-20.521z" />
            </g>
        </svg>
    );
}

function CaloriesIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12.5 3c1.7 2.1 2.5 4 2.5 5.8 0 1.6-.7 2.8-1.7 4 .8-.2 1.5-.3 2.2-.3 3 0 5 2.3 5 5 0 3.2-2.7 5.5-6.1 5.5-4.6 0-7.4-3.1-7.4-6.9 0-3.7 2.1-5.9 5.5-8.8Z" />
        </svg>
    );
}

function Co2Icon() {
    return (
        <svg className="co2Icon" viewBox="0 0 508 508" aria-hidden="true" focusable="false">
            <circle cx="254" cy="254" r="254" />
            <path d="M408.4,217.6c2.4-4.8,3.6-10.4,3.6-16c0-21.2-17.2-38-38-38c-0.4,0-0.8,0-1.2,0c-10-37.6-44-65.2-84.8-65.2 c-28.4,0-53.6,13.6-70,34.4c-9.6-5.2-20.4-8-32-8c-38,0-69.2,30.8-69.2,69.2c0,6,0.8,11.6,2,16.8c-34.8,6-61.6,36.8-61.6,73.6 c0,41.2,33.6,74.8,74.8,74.8h243.6c41.2,0,74.8-33.6,74.8-74.8C450.4,255.6,433.2,230,408.4,217.6z" />
            <path d="M188.4,215.2c8.8,0,16,3.6,21.6,10.8l11.6-12.8c-9.2-10.4-20.4-15.6-34-15.6c-12,0-22.4,4-30.8,12.4 c-8.4,8-12.4,18.4-12.4,30.4c0,12.4,4,22.4,12.4,30.4s18.8,12,31.2,12s23.6-5.2,33.2-15.6l-11.6-12c-5.6,7.2-13.2,10.8-22,10.8 c-6.4,0-12.4-2.4-16.8-6.8c-4.8-4.8-6.8-10.8-6.8-18.4c0-7.6,2.4-13.6,7.2-18.4C175.6,217.2,181.6,215.2,188.4,215.2z" />
            <path d="M272.4,197.6c-12,0-22.4,4-30.8,12c-8.4,8-12.4,18.4-12.4,30.4s4,22.4,12.4,30.4s18.4,12,30.8,12 s22.4-4,30.8-12s12.4-18.4,12.4-30.4s-4-22.4-12.4-30.4S284.8,197.6,272.4,197.6z M290,258.8c-4.8,5.2-10.4,7.6-17.2,7.6 c-6.8,0-12.8-2.4-17.2-7.6c-4.8-5.2-7.2-11.2-7.2-18.8c0-7.2,2.4-13.6,7.2-18.8c4.8-5.2,10.4-7.6,17.2-7.6c6.8,0,12.8,2.4,17.2,7.6 c4.8,5.2,7.2,11.6,7.2,18.8C297.2,247.6,294.8,253.6,290,258.8z" />
            <path d="M342,286.8l9.6-10c4-4,6.4-7.2,8-10c1.6-2.4,2-5.2,2-8c0-5.2-1.6-9.2-5.2-12s-7.6-4.4-12.4-4.4 s-8.4,1.2-11.6,3.2s-6,5.2-8.4,8.8l9.6,5.6c3.2-4.8,6.4-7.2,9.6-7.2c2,0,3.2,0.8,4.4,2c1.2,1.2,1.6,2.8,1.6,4.4c0,2-0.8,3.6-2,5.6 s-3.6,4.4-6.8,8l-16,16.4v9.2h38.4v-10.8H342V286.8z" />
        </svg>
    );
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

function formatDistance(distanceInKm, language) {
    if (distanceInKm < 1) {
        return `${Math.round(distanceInKm * 1000)} m`;
    }

    const formatter = new Intl.NumberFormat(language === 'sl' ? 'sl-SI' : language === 'fr' ? 'fr-FR' : 'en-GB', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

    return `${formatter.format(distanceInKm)} km`;
}

function formatRoundedNumber(value, language) {
    return new Intl.NumberFormat(language === 'sl' ? 'sl-SI' : language === 'fr' ? 'fr-FR' : 'en-GB', {
        maximumFractionDigits: 0
    }).format(Math.round(value));
}

function estimateStepCount(distanceInKm) {
    const strideLengthMeters = REFERENCE_HEIGHT_METERS * ESTIMATED_STRIDE_RATIO;
    return Math.max(1, Math.round((distanceInKm * 1000) / strideLengthMeters));
}

function estimateCalories(distanceInKm) {
    return Math.max(1, Math.round(distanceInKm * CALORIES_PER_KM));
}

function estimateExhaledCo2Grams(calories) {
    return Math.max(1, Math.round(calories * CO2_GRAMS_PER_KCAL));
}

function renderMetricTag({ icon, label, value, unit, approximate = false }) {
    const formattedUnit = unit
        ? (/^g/.test(unit) ? unit : ` ${unit}`)
        : '';

    return (
        <span className="nearestTreeTag">
            <span className="nearestTreeTag__icon">{icon}</span>
            <span className="nearestTreeTag__value">
                {approximate ? '\u2243 ' : ''}
                {value}
                {formattedUnit}
            </span>
            {label ? <span className="nearestTreeTag__label">{label}</span> : null}
        </span>
    );
}

function renderNearestTreeSummary(nearestTree, nearestTreeLabel, dictionary, userLanguage, cityInfoCurrent, onOpenOxygenInfo, options = {}) {
    if (!nearestTree) {
        return null;
    }

    const { showLead = true, variant = 'default' } = options;
    const summaryClassName = variant === 'floating'
        ? 'nearestTreeSummary nearestTreeSummary--floating'
        : 'nearestTreeSummary';
    const metaClassName = variant === 'floating'
        ? 'nearestTreeMeta nearestTreeMeta--floating'
        : 'nearestTreeMeta';

    const yearLabel = (dictionary.nearestTreeYearLabel || 'tree of the year {year}')
        .replace('{year}', nearestTree.year);
    const distanceLabel = formatDistance(nearestTree.walkingDistanceInKm, userLanguage);
    const stepCount = estimateStepCount(nearestTree.walkingDistanceInKm);
    const calories = estimateCalories(nearestTree.walkingDistanceInKm);
    const co2Grams = estimateExhaledCo2Grams(calories);
    const oxygenEstimate = estimateTreeOxygenForWalk({
        speciesId: nearestTree.name,
        walkingTimeInMinutes: nearestTree.walkingTimeInMinutes,
        weatherCode: cityInfoCurrent?.weatherCode,
        temperature: cityInfoCurrent?.temperature,
        sunrise: cityInfoCurrent?.sunrise,
        sunset: cityInfoCurrent?.sunset,
        currentTime: cityInfoCurrent?.time
    });
    const formattedSteps = formatRoundedNumber(stepCount, userLanguage);
    const formattedCalories = formatRoundedNumber(calories, userLanguage);
    const formattedCo2 = formatRoundedNumber(co2Grams, userLanguage);
    const formattedOxygen = oxygenEstimate
        ? formatRoundedNumber(oxygenEstimate.gramsDuringWalk, userLanguage)
        : null;

    return (
        <div className={summaryClassName}>
            <div className="nearestTreeSummary__header">
                <div className="nearestTreeSummary__headerText">
                    {showLead ? (
                        <p className="nearestTreeSummary__lead">
                            <Text tid="nearestTreeSummaryPrefix" />
                        </p>
                    ) : null}
                    <p className={metaClassName}>
                        {yearLabel}, {nearestTreeLabel}
                    </p>
                </div>
                {formattedOxygen ? (
                    <div className="nearestTreeSummary__headerTag">
                        <div className="oxygenInfoInline">
                            {renderMetricTag({
                            icon: <OxygenIcon />,
                            label: dictionary.nearestTreeMetricO2 ?? 'produit',
                            value: formattedOxygen,
                            unit: dictionary.nearestTreeMetricO2Unit ?? 'g O\u2082',
                            approximate: true
                            })}
                            {onOpenOxygenInfo ? (
                                <button
                                    type="button"
                                    className="oxygenInfoButton oxygenInfoButton--header"
                                    onClick={onOpenOxygenInfo}
                                >
                                    <Text tid="oxygenInfoAction" />
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>
            <div className="nearestTreeTags" aria-label={dictionary.nearestTreeTitle || 'Nearest tree'}>
                {renderMetricTag({
                    icon: <DistanceIcon />,
                    label: dictionary.nearestTreeMetricDistance ?? 'Distance',
                    value: distanceLabel
                })}
                {renderMetricTag({
                    icon: <StepsIcon />,
                    label: dictionary.nearestTreeMetricSteps ?? 'Steps',
                    value: formattedSteps,
                    approximate: true
                })}
                {renderMetricTag({
                    icon: <CaloriesIcon />,
                    label: dictionary.nearestTreeMetricCalories ?? 'Calories',
                    value: formattedCalories,
                    unit: dictionary.nearestTreeMetricCaloriesUnit ?? 'kcal',
                    approximate: true
                })}
                {renderMetricTag({
                    icon: <Co2Icon />,
                    label: dictionary.nearestTreeMetricCo2 ?? 'Exhaled CO\u2082',
                    value: formattedCo2,
                    unit: dictionary.nearestTreeMetricCo2Unit ?? 'g CO\u2082',
                    approximate: true
                })}
            </div>
        </div>
    );
}

function renderNearestTreeFeedbackContent(nearestTreeState, nearestTree, nearestTreeSummary) {
    if (nearestTreeState === 'meta-browser') {
        return (
            <div className="nearestTreeStatus">
                <MetaInAppBrowserNotice />
            </div>
        );
    }

    if (nearestTreeState === 'unsupported') {
        return (
            <p className="nearestTreeStatus">
                <Text tid="nearestTreeUnsupported" />
            </p>
        );
    }

    if (nearestTreeState === 'denied') {
        return (
            <p className="nearestTreeStatus">
                <Text tid="nearestTreeDenied" />
            </p>
        );
    }

    if (nearestTreeState === 'error') {
        return (
            <p className="nearestTreeStatus">
                <Text tid="nearestTreeError" />
            </p>
        );
    }

    if (nearestTreeState === 'loading') {
        return (
            <p className="nearestTreeStatus">
                <Text tid="nearestTreeLoading" />
            </p>
        );
    }

    if (nearestTreeState === 'route-error' && nearestTree) {
        return (
            <div className="nearestTreeStatus nearestTreeResult">
                {nearestTreeSummary}
                <p><Text tid="nearestTreeRouteUnavailable" /></p>
            </div>
        );
    }

    if (nearestTreeState === 'too-far' && nearestTree) {
        return (
            <div className="nearestTreeStatus nearestTreeResult">
                {nearestTreeSummary}
            </div>
        );
    }

    if (nearestTreeState === 'ready' && nearestTree) {
        return (
            <div className="nearestTreeStatus nearestTreeResult">
                {nearestTreeSummary}
            </div>
        );
    }

    return null;
}

const ListByYears = (props) => {
    const { isTreeUnlocked, setDm } = useContext(PinContext);
    const [setYearselected, yearselected, mapData] = props.actions;
    const setTmppins = props.hover;

    const handleYearClick = (event, value) => {
        event.preventDefault();
        event.stopPropagation();
        setTmppins(0);

        if (mapData.mapObj) {
            mapData.mapObj.closePopup();
        }

        if (value === yearselected) {
            setYearselected(0);
            mapData.goToArea(LJUBLJANA_COORDS, 13);
        } else {
            setYearselected(value);
            const goToLngLt = trees[value][0].coords;
            mapData.goToArea(goToLngLt, 16);
        }

        // Close after the current pointer/click sequence to avoid click-through on the map.
        window.setTimeout(() => {
            setDm(false);
        }, 0);
    };

    const years = [];
    for (const [index, value] of listDate.entries()) {
        const isUnlocked = isTreeUnlocked(value);
        const itemClassName = [
            yearselected === value ? "active" : "",
            !isUnlocked ? "locked" : ""
        ].filter(Boolean).join(" ");

        years.push(
            <li
                className={itemClassName}
                key={index}
                onPointerMove={() => setTmppins(value)}
                onPointerOut={() => setTmppins(0)}
                onClick={(event) => handleYearClick(event, value)}>
                {value}
            </li>
        );
    }
    return <ul>{years}</ul>;
};

const Col = () => {
    const [circles, setCircles] = useState([]);
    const [isNearestTreeFloatingDismissed, setIsNearestTreeFloatingDismissed] = useState(false);
    const [treeEnvironment, setTreeEnvironment] = useState({ status: 'idle', current: null });
    const { setDm, dm, setYearselected, setShowClouds, showClouds, setModalContent, setTmppins, yearselected, mapData, dictionary, userLanguage, nearestTree, nearestTreeState, locateNearestTree, focusAllTrees, isTreeUnlocked, guidedTreeId, nextTreeSuggestion, routeMeta, openOxygenInfoModal } = useContext(PinContext);

    const escFunction = useCallback((event) => {
        if (event.keyCode === 27) {
            if (dm) {
                setDm(false);
            }
        }
    }, [dm, setDm]);

    useEffect(() => {
        generateCircles();
        document.addEventListener('keydown', escFunction);
        return () => {
            document.removeEventListener('keydown', escFunction);
        };
    }, [escFunction]);

    function generateCircles() {
        const newCircles = []
        for (let i = 0; i < 150; i++) {
            const size = Math.floor(Math.random() * 20) + 10;
            newCircles.push({
                size: size,
            });
        }
        setCircles(newCircles);
    }

    const guidedTreeBase = guidedTreeId
        ? [nearestTree, nextTreeSuggestion].find((tree) => tree?.year === guidedTreeId)
        : null;
    const guidedTree = guidedTreeBase && routeMeta?.distanceInKm != null && routeMeta?.durationInMinutes != null
        ? {
            ...guidedTreeBase,
            walkingDistanceInKm: routeMeta.distanceInKm,
            walkingTimeInMinutes: routeMeta.durationInMinutes
        }
        : guidedTreeBase;
    const activeFeedbackTree = guidedTreeId
        ? guidedTree?.walkingDistanceInKm != null ? guidedTree : null
        : nearestTree;
    const activeFeedbackState = guidedTreeId && activeFeedbackTree?.walkingDistanceInKm != null
        ? 'ready'
        : nearestTreeState;
    const nearestTreeLabel = activeFeedbackTree ? (dictionary[`adrs${activeFeedbackTree.year}`] || activeFeedbackTree.year) : '';
    const handleOpenOxygenInfo = activeFeedbackTree && treeEnvironment.current
        ? () => openOxygenInfoModal({
            source: 'nearest-tree',
            speciesId: activeFeedbackTree.name,
            year: activeFeedbackTree.year,
            walkingTimeInMinutes: activeFeedbackTree.walkingTimeInMinutes,
            weatherCode: treeEnvironment.current.weatherCode,
            temperature: treeEnvironment.current.temperature,
            sunrise: treeEnvironment.current.sunrise,
            sunset: treeEnvironment.current.sunset,
            currentTime: treeEnvironment.current.time
        })
        : null;
    const nearestTreeSummary = renderNearestTreeSummary(activeFeedbackTree, nearestTreeLabel, dictionary, userLanguage, treeEnvironment.current, handleOpenOxygenInfo);
    const nearestTreeSummaryFloating = renderNearestTreeSummary(
        activeFeedbackTree,
        nearestTreeLabel,
        dictionary,
        userLanguage,
        treeEnvironment.current,
        handleOpenOxygenInfo,
        { showLead: false, variant: 'floating' }
    );
    const nearestTreeFeedback = renderNearestTreeFeedbackContent(activeFeedbackState, activeFeedbackTree, nearestTreeSummary);
    const nearestTreeFeedbackFloating = renderNearestTreeFeedbackContent(activeFeedbackState, activeFeedbackTree, nearestTreeSummaryFloating);
    const hasUnlockedEveryTree = listDate.every((year) => isTreeUnlocked(year));
    const isNearestTreeFeedbackVisible = !hasUnlockedEveryTree && nearestTreeFeedbackFloating && !isNearestTreeFloatingDismissed;

    useEffect(() => {
        setIsNearestTreeFloatingDismissed(false);
    }, [
        nearestTreeState,
        nearestTree?.year,
        nearestTree?.walkingDistanceInKm,
        nearestTree?.walkingTimeInMinutes,
        guidedTreeId,
        nextTreeSuggestion?.walkingDistanceInKm,
        nextTreeSuggestion?.walkingTimeInMinutes,
        routeMeta?.distanceInKm,
        routeMeta?.durationInMinutes
    ]);

    useEffect(() => {
        if (!activeFeedbackTree?.name) {
            setTreeEnvironment({ status: 'idle', current: null });
            return undefined;
        }

        const controller = new AbortController();

        setTreeEnvironment((previousState) => ({
            status: previousState.current ? 'refreshing' : 'loading',
            current: previousState.current
        }));

        fetchLjubljanaCityInfo(userLanguage, controller.signal)
            .then((data) => {
                setTreeEnvironment({
                    status: 'ready',
                    current: data.current
                });
            })
            .catch((error) => {
                if (error.name === 'AbortError') {
                    return;
                }

                setTreeEnvironment((previousState) => ({
                    status: 'error',
                    current: previousState.current
                }));
            });

        return () => {
            controller.abort();
        };
    }, [activeFeedbackTree?.name, userLanguage]);

    const handleBadgeClick = () => {
        setYearselected(0);
        setTmppins(0);
        focusAllTrees();
    };
    const handleOpenTreasure = () => {
        setModalContent('treasure');
        if (!dm) {
            setDm(true);
        }
    };
    const handleLocateNearestTree = () => {
        if (dm) {
            setDm(false);
        }
        setIsNearestTreeFloatingDismissed(false);
        locateNearestTree();
    };
    return (
        <>
            <div className="pannel">
                <div className="panelMetaRow">
                    <LanguageSelector />
                    <button
                        type="button"
                        className="panelContactMobile"
                        onClick={() => { setModalContent('contact'); if (!dm) setDm(true) }}
                    >
                        <Text tid="contact" />
                    </button>
                </div>

                <h1 onClick={() => { setModalContent('about'); if (!dm) setDm(true) }}>
                    <Text tid="titre" />
                    <span className="about">?</span>
                </h1>

                <button
                    type="button"
                    className="badgeWrapper"
                    onClick={handleBadgeClick}
                    title={hasUnlockedEveryTree ? (dictionary.gameWonBadgeTitle || 'Well done, you discovered every tree') : (dictionary.mapResetViewAction || 'Show all trees')}
                    aria-label={hasUnlockedEveryTree ? (dictionary.gameWonBadgeTitle || 'Well done, you discovered every tree') : (dictionary.mapResetViewAction || 'Show all trees')}
                >
                    <img src={badge} alt="Ljubljana tree badge" />
                    {hasUnlockedEveryTree && (
                        <img className="badgeWrapper__cup" src={coupe} alt="" aria-hidden="true" />
                    )}
                </button>

                <div className="content">
                    <ListByYears actions={[setYearselected, yearselected, mapData]} hover={setTmppins} />
                    <div className="nearestTreeCard">
                        {hasUnlockedEveryTree ? (
                            <button type="button" className="treasurePanelLink" onClick={handleOpenTreasure}>
                                <img src={treasure} alt="" aria-hidden="true" />
                                <span className="treasurePanelLink__text">
                                    <strong><Text tid="gameTreasurePanelTitle" /></strong>
                                    <span><Text tid="gameTreasurePanelBody" /></span>
                                </span>
                            </button>
                        ) : (
                            <>
                                <button type="button" className="nearestTreeButton nearestTreeButton--panel" onClick={handleLocateNearestTree}>
                                    {nearestTreeState === 'loading' ? <Text tid="nearestTreeLoading" /> : <Text tid="nearestTreeAction" />}
                                </button>
                                <div className="nearestTreeFeedback nearestTreeFeedback--panel">
                                    {nearestTreeFeedback}
                                </div>
                            </>
                        )}
                    </div>
                </div>


                <div className="menu">
                    <span className="panelContactDesktop" onClick={() => { setModalContent('contact'); if (!dm) setDm(true) }}><Text tid="contact" /></span>
                    <span onClick={() => { setShowClouds(!showClouds) }} className={`cloudTrigger ${showClouds ? 'active' : 'inactif'}`}></span>
                </div>

            </div>
            {!dm && (
                <button
                    type="button"
                    className={`nearestTreeButton nearestTreeButton--floating${isNearestTreeFeedbackVisible ? ' nearestTreeButton--belowFeedback' : ''}`}
                    onClick={handleLocateNearestTree}
                    aria-label={dictionary.nearestTreeAction || 'Find the nearest tree'}
                    title={dictionary.nearestTreeAction || 'Find the nearest tree'}
                >
                    <WalkingIcon />
                </button>
            )}
            {!dm && isNearestTreeFeedbackVisible && (
                <div className="nearestTreeFeedback nearestTreeFeedback--floating">
                    <div className="nearestTreeFeedbackFloatingTopbar">
                        <p className="nearestTreeFeedbackFloatingTitle">
                            {dictionary.nearestTreeTitle || 'Nearest tree'}
                        </p>
                        <button
                            type="button"
                            className="nearestTreeFeedbackClose"
                            onClick={() => setIsNearestTreeFloatingDismissed(true)}
                            aria-label={dictionary.close || 'Fermer'}
                            title={dictionary.close || 'Fermer'}
                        >
                            &times;
                        </button>
                    </div>
                    <button
                        type="button"
                        className="nearestTreeFeedbackClose"
                        onClick={() => setIsNearestTreeFloatingDismissed(true)}
                        aria-label={dictionary.close || 'Fermer'}
                        title={dictionary.close || 'Fermer'}
                    >
                        {'\u00D7'}
                    </button>
                    {nearestTreeFeedbackFloating}
                </div>
            )}
            <div className="containerDeco">
                <div className="containerCircles">
                    {circles.map((circle, index) => (
                        <div
                            key={index}
                            className="circle"
                            style={{
                                width: circle.size,
                                height: circle.size,
                                borderRadius: `50%`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export default Col;
