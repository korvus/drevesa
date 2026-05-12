import {
    MapContainer,
    TileLayer,
    useMap,
    useMapEvent,
    Popup,
    Marker,
    CircleMarker,
    Polyline
} from "react-leaflet";
import Cloud from './cloud.js';
import Modalcontent from './modal.js';
import coords from '../datas/datas.json';
import { PinContext, Text } from '../store';
import { useEffect, useRef, useContext, useState, useCallback } from "react";
import { getIcon } from '../components/icon.js';
import speciesDetails from '../datas/speciesDetails.js';
import herbierFerme from '../img/herbierFerme.png';
import treasure from '../img/treasure.png';
import carteExplication from '../img/carteExplication.png';
import { fetchLjubljanaCityInfo } from '../utils/ljubljanaCityInfo.js';
import { estimateTreeOxygenForWalk } from '../utils/treeOxygenEstimate.js';

const Ljubljana = [46.0507666, 14.5047565];
const EXCLUDED_TREE_YEARS = new Set(['2023']);
const listDate = Object.keys(coords).filter((year) => !EXCLUDED_TREE_YEARS.has(year));
const GAME_DISTANCE_THRESHOLD_METERS = 20;
const MAX_WALKING_TIME_MINUTES = 120;
const MOBILE_BREAKPOINT_PX = 767;
const MOBILE_POPUP_OFFSET = [0, 28];
const MOBILE_POPUP_TOP_LEFT_PADDING = [12, 320];
const MOBILE_POPUP_BOTTOM_RIGHT_PADDING = [12, 28];

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

    return <span className="mapCityInfoTag__weather" aria-hidden="true">{icon}</span>;
}

function renderStrongTemplate(template, replacements) {
    const tokenPattern = /(\{[a-zA-Z0-9_]+\})/g;

    return template
        .split(tokenPattern)
        .filter(Boolean)
        .map((part, index) => {
            const replacement = replacements[part];

            if (replacement == null) {
                return part;
            }

            return <strong key={`${part}-${index}`}>{replacement}</strong>;
        });
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

function StopwatchIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 5.2a7.8 7.8 0 1 0 7.8 7.8A7.81 7.81 0 0 0 12 5.2Zm0 14.6A6.8 6.8 0 1 1 18.8 13 6.81 6.81 0 0 1 12 19.8Z" />
            <path d="M10.1 2.8h3.8" />
            <path d="M12 5.2V2.8" />
            <path d="M16.1 6.1l1.8-1.8" />
            <path d="M12 13V9.1" />
            <path d="M12 13h3.2" />
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

function haversineDistanceInMeters(fromCoords, toCoords) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const [fromLat, fromLng] = fromCoords;
    const [toLat, toLng] = toCoords;
    const deltaLat = toRadians(toLat - fromLat);
    const deltaLng = toRadians(toLng - fromLng);
    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRadians(fromLat)) *
        Math.cos(toRadians(toLat)) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function LockedTreePopup({ treeId, treeName, coords, isMobileViewport = false }) {
    const { userPosition, setUserPosition, unlockTree, guidedTreeId, nearestTree, nextTreeSuggestion, routeToTree, routeMeta, userLanguage, mapData, startFollowingUser, isFollowingUser, dictionary } = useContext(PinContext);
    const [distanceInMeters, setDistanceInMeters] = useState(null);
    const [geoStatus, setGeoStatus] = useState('idle');
    const [treeEnvironment, setTreeEnvironment] = useState({ status: 'idle', current: null });
    const watchIdRef = useRef(null);
    const lastPositionRef = useRef(null);
    const lastUpdateTsRef = useRef(0);
    const isGuidedTree = guidedTreeId === treeId;
    const isNearestTree = nearestTree && nearestTree.year === treeId;

    useEffect(() => {
        if (!userPosition) {
            setDistanceInMeters(null);
            return;
        }

        setDistanceInMeters(Math.round(haversineDistanceInMeters(userPosition, coords)));
    }, [coords, userPosition]);

    const isNearby = distanceInMeters !== null && distanceInMeters <= GAME_DISTANCE_THRESHOLD_METERS;
    const hasRouteToThisTree = routeToTree.length > 1 && (isGuidedTree || isNearestTree);
    const isFollowingThisTree = isFollowingUser && isGuidedTree;
    const fallbackWalkingMinutes = distanceInMeters !== null
        ? Math.max(1, Math.round(((distanceInMeters / 1000) / 4.8) * 60))
        : null;
    const routedDistanceInKm = isNearestTree && nearestTree?.walkingDistanceInKm != null
        ? nearestTree.walkingDistanceInKm
        : isGuidedTree && routeMeta?.distanceInKm != null
            ? routeMeta.distanceInKm
            : isGuidedTree && nextTreeSuggestion?.year === treeId && nextTreeSuggestion?.walkingDistanceInKm != null
                ? nextTreeSuggestion.walkingDistanceInKm
                : null;
    const routedWalkingMinutes = isNearestTree && nearestTree?.walkingTimeInMinutes != null
        ? nearestTree.walkingTimeInMinutes
        : isGuidedTree && routeMeta?.durationInMinutes != null
            ? routeMeta.durationInMinutes
            : isGuidedTree && nextTreeSuggestion?.year === treeId && nextTreeSuggestion?.walkingTimeInMinutes != null
                ? nextTreeSuggestion.walkingTimeInMinutes
                : null;
    const distanceLabel = routedDistanceInKm !== null
        ? formatDistance(routedDistanceInKm, userLanguage)
        : distanceInMeters !== null
            ? `${distanceInMeters} m`
            : null;
    const estimatedWalkingMinutes = routedWalkingMinutes ?? fallbackWalkingMinutes;
    const exceedsMaxWalkingTime = estimatedWalkingMinutes !== null && estimatedWalkingMinutes > MAX_WALKING_TIME_MINUTES;
    const shouldShowGoThere = !isNearby && !isFollowingThisTree && !exceedsMaxWalkingTime;
    const distanceForEstimateInKm = routedDistanceInKm ?? (distanceInMeters !== null ? distanceInMeters / 1000 : null);
    const estimatedCalories = distanceForEstimateInKm !== null
        ? Math.max(1, Math.round(distanceForEstimateInKm * 52.5))
        : null;
    const estimatedCo2Grams = estimatedCalories !== null
        ? Math.max(1, Math.round(estimatedCalories * 0.39))
        : null;
    const oxygenEstimate = treeEnvironment.current && estimatedWalkingMinutes !== null
        ? estimateTreeOxygenForWalk({
            speciesId: treeName,
            walkingTimeInMinutes: estimatedWalkingMinutes,
            weatherCode: treeEnvironment.current.weatherCode,
            temperature: treeEnvironment.current.temperature,
            sunrise: treeEnvironment.current.sunrise,
            sunset: treeEnvironment.current.sunset,
            currentTime: treeEnvironment.current.time
        })
        : null;
    const formattedContextCo2 = estimatedCo2Grams !== null
        ? new Intl.NumberFormat(userLanguage === 'sl' ? 'sl-SI' : userLanguage === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 0 }).format(estimatedCo2Grams)
        : null;
    const formattedContextO2 = oxygenEstimate
        ? new Intl.NumberFormat(userLanguage === 'sl' ? 'sl-SI' : userLanguage === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 0 }).format(Math.round(oxygenEstimate.gramsDuringWalk))
        : null;
    const contextSentence = dictionary.nearestTreeContextSentence || null;

    useEffect(() => {
        const controller = new AbortController();

        fetchLjubljanaCityInfo(userLanguage, controller.signal)
            .then((data) => {
                setTreeEnvironment({
                    status: 'ready',
                    current: data.current
                });
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    setTreeEnvironment({ status: 'error', current: null });
                }
            });

        return () => controller.abort();
    }, [userLanguage]);

    useEffect(() => {
        if (!navigator.geolocation) {
            return undefined;
        }

        const maybeUpdatePosition = (coords) => {
            const nextPosition = [coords.latitude, coords.longitude];
            const now = Date.now();
            const lastPosition = lastPositionRef.current;
            const lastUpdateTs = lastUpdateTsRef.current;

            if (lastPosition) {
                const movedDistance = haversineDistanceInMeters(lastPosition, nextPosition);
                const elapsedMs = now - lastUpdateTs;

                // Ignore tiny GPS jitter unless enough time has passed.
                if (movedDistance < 5 && elapsedMs < 12000) {
                    return;
                }
            }

            lastPositionRef.current = nextPosition;
            lastUpdateTsRef.current = now;
            setUserPosition(nextPosition);
            setGeoStatus('ready');
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            ({ coords: currentCoords }) => {
                maybeUpdatePosition(currentCoords);
            },
            () => {
                setGeoStatus('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 10000
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [setUserPosition]);

    const handleGoThere = () => {
        if (!navigator.geolocation) {
            setGeoStatus('unsupported');
            return;
        }

        setGeoStatus('loading');
        startFollowingUser({ year: treeId, coords });

        if (mapData.mapObj && !userPosition) {
            mapData.mapObj.closePopup();
            mapData.mapObj.flyTo(coords, 17);
        }
    };

    return (
        <div className="gamePopup">
            <span className="title">{treeId}</span>
            <p><Text tid="gameLockedIntro" /></p>
            {(distanceLabel !== null || estimatedWalkingMinutes !== null) && (
                <div className="gamePopupMetrics">
                    {!isMobileViewport && distanceLabel !== null && (
                        <span className="nearestTreeTag nearestTreeTag--popup">
                            <span className="nearestTreeTag__icon"><DistanceIcon /></span>
                            <span className="nearestTreeTag__value">{distanceLabel}</span>
                        </span>
                    )}
                    {estimatedWalkingMinutes !== null && (
                        <span className="nearestTreeTag nearestTreeTag--popup">
                            <span className="nearestTreeTag__icon"><StopwatchIcon /></span>
                            <span className="nearestTreeTag__value">{estimatedWalkingMinutes} <Text tid="nearestTreeMinutesShort" /></span>
                        </span>
                    )}
                </div>
            )}
            {contextSentence && formattedContextCo2 && formattedContextO2 ? (
                <p className="gamePopupContextBand">
                    {renderStrongTemplate(contextSentence, {
                        '{co2}': `${formattedContextCo2}${dictionary.nearestTreeMetricCo2Unit ?? 'g COâ‚‚'}`,
                        '{o2}': `${formattedContextO2}${dictionary.nearestTreeMetricO2Unit ?? 'g Oâ‚‚'}`
                    })}
                </p>
            ) : null}
            {shouldShowGoThere && (
                <button type="button" className="gamePopupButton gamePopupButton--secondary" onClick={handleGoThere}>
                    <Text tid={hasRouteToThisTree ? "gameStartFollowing" : "gameGoThere"} />
                </button>
            )}
            {isNearby ? (
                <button type="button" className="gamePopupButton" onClick={() => unlockTree(treeId)}>
                    <Text tid="gameUnlockCta" />
                </button>
            ) : null}
            {distanceInMeters !== null && !isNearby && (
                <p><Text tid="gameNeedCloser" /></p>
            )}
            {exceedsMaxWalkingTime && (
                <p><Text tid="nearestTreeTooFar" /></p>
            )}
            {geoStatus === 'unsupported' && <p><Text tid="nearestTreeUnsupported" /></p>}
            {geoStatus === 'error' && <p><Text tid="nearestTreeError" /></p>}
        </div>
    );
}

function UnlockedTreePopup({ treeId, treeData, userLanguage }) {
    const { traceNextLockedTreeFrom, openSpeciesModal, openOxygenInfoModal, dictionary, isTreeUnlocked, setModalContent, setDm, mapData } = useContext(PinContext);
    const [traceState, setTraceState] = useState('idle');
    const [treeEnvironment, setTreeEnvironment] = useState({ status: 'idle', current: null });
    const speciesData = speciesDetails[treeData.name];
    const hasRemainingLockedTrees = listDate.some((year) => !isTreeUnlocked(year));

    useEffect(() => {
        const controller = new AbortController();

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

                setTreeEnvironment({ status: 'error', current: null });
            });

        return () => controller.abort();
    }, [userLanguage]);

    const oxygenEstimate = treeEnvironment.current
        ? estimateTreeOxygenForWalk({
            speciesId: treeData.name,
            walkingTimeInMinutes: 60,
            weatherCode: treeEnvironment.current.weatherCode,
            temperature: treeEnvironment.current.temperature,
            sunrise: treeEnvironment.current.sunrise,
            sunset: treeEnvironment.current.sunset,
            currentTime: treeEnvironment.current.time
        })
        : null;
    const formattedOxygenPerHour = oxygenEstimate
        ? new Intl.NumberFormat(userLanguage === 'sl' ? 'sl-SI' : userLanguage === 'fr' ? 'fr-FR' : 'en-GB', {
            maximumFractionDigits: 0
        }).format(Math.round(oxygenEstimate.gramsPerHour))
        : null;

    const handleTraceNextTree = async () => {
        setTraceState('loading');
        const nextTree = await traceNextLockedTreeFrom(treeId);
        setTraceState(nextTree ? 'ready' : 'done');
    };

    const handleOpenTreasure = () => {
        setModalContent('treasure');
        setDm(true);
    };

    const handleOpenOxygenInfo = () => {
        if (!treeEnvironment.current) {
            return;
        }

        if (mapData.mapObj) {
            mapData.mapObj.closePopup();
        }

        openOxygenInfoModal({
            source: 'unlocked-popup',
            speciesId: treeData.name,
            year: treeId,
            walkingTimeInMinutes: 60,
            weatherCode: treeEnvironment.current.weatherCode,
            temperature: treeEnvironment.current.temperature,
            sunrise: treeEnvironment.current.sunrise,
            sunset: treeEnvironment.current.sunset,
            currentTime: treeEnvironment.current.time
        });
    };

    return (
        <>
            <span className="title">{treeId}</span>
            <div className="unlockedPopupBody">
                <div className="popupField popupField--species">
                    <div className="popupFieldValue">
                        <div className="popupSpeciesStack">
                        {speciesData ? (
                            <button
                                type="button"
                                className="speciesTrigger"
                                onClick={() => openSpeciesModal(treeData.name)}
                                title={dictionary.speciesModalTriggerHint}
                                aria-label={dictionary.speciesModalTriggerHint}
                            >
                                <img className="speciesTriggerIcon" src={herbierFerme} alt="" aria-hidden="true" />
                                <Text as="span" tid={speciesData.nameTid} />
                            </button>
                        ) : (
                            <Text as="span" tid={treeData.name} />
                        )}
                        {formattedOxygenPerHour && (
                            <div className="popupOxygenInfoRow">
                                <div className="popupOxygenTag">
                                <span className="popupOxygenTag__icon"><OxygenIcon /></span>
                                <span className="popupOxygenTag__value">ÃƒÂ¢Ã¢â‚¬Â°Ã†â€™ {formattedOxygenPerHour}g OÃƒÂ¢Ã¢â‚¬Å¡Ã¢â‚¬Å¡ / h</span>
                                </div>
                                <button type="button" className="oxygenInfoButton oxygenInfoButton--popup" onClick={handleOpenOxygenInfo}>
                                    <Text tid="oxygenInfoAction" />
                                </button>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
                <div className="popupField popupField--address">
                    <span className="popupFieldLabel"><Text tid='address' /></span>
                    <div className="popupFieldValue">
                        <a
                            className="externalLink popupAddressLink"
                            rel="noreferrer"
                            target="_blank"
                            href={treeData.adresse}
                        >
                            <img className="popupAddressIcon" src={carteExplication} alt="" aria-hidden="true" />
                            <Text tid={`adrs${treeId}`} />
                        </a>
                    </div>
                </div>
            </div>
            <div className="gamePopup gamePopup--next">
                {hasRemainingLockedTrees ? (
                    <>
                        <p><Text tid="gameNextTreePrompt" /></p>
                        <button type="button" className="gamePopupButton" onClick={handleTraceNextTree}>
                            {traceState === 'loading' ? <Text tid="nearestTreeLoading" /> : <Text tid="gameTraceNextTree" />}
                        </button>
                        {traceState === 'done' && (
                            <p><Text tid="gameAllTreesUnlocked" /></p>
                        )}
                    </>
                ) : (
                    <button type="button" className="treasureLink" onClick={handleOpenTreasure}>
                        <img src={treasure} alt="" aria-hidden="true" />
                        <span><Text tid="gameTreasureAction" /></span>
                    </button>
                )}
            </div>
        </>
    );
}

function constructJsx(trees, map, markerRef, userLanguage, isTreeUnlocked, setYearselected, isMobileViewport) {
    const jsxElements = [];
    let i = 0;
    let shouldBeOneAtLeast = 0;
    for (var tree in trees) {

        const title = String(trees[tree].popup[0]);

        if (trees.hasOwnProperty(tree)) {
            const unlocked = isTreeUnlocked(title);
            const icone = getIcon(unlocked ? trees[tree].icon : 'questionMarkTree');
            const popupOptions = isMobileViewport ? {
                offset: MOBILE_POPUP_OFFSET,
                autoPanPaddingTopLeft: MOBILE_POPUP_TOP_LEFT_PADDING,
                autoPanPaddingBottomRight: MOBILE_POPUP_BOTTOM_RIGHT_PADDING
            } : {};

            if (map.getBounds().contains(trees[tree].coords)) { shouldBeOneAtLeast++ };

            jsxElements.push(
                <Marker
                    key={i}
                    position={trees[tree].coords}
                    icon={icone}
                    ref={el => { markerRef.current[title] = el }}
                    eventHandlers={{
                        popupopen: () => {
                            setYearselected(title);
                        }
                    }}
                >
                    <Popup
                        maxWidth={264}
                        minWidth={0}
                        {...popupOptions}
                    >
                        {unlocked ? (
                            <UnlockedTreePopup treeId={title} treeData={trees[tree]} userLanguage={userLanguage} />
                        ) : (
                            <LockedTreePopup treeId={title} treeName={trees[tree].name} coords={trees[tree].coords} isMobileViewport={isMobileViewport} />
                        )}

                    </Popup>
                </Marker>
            );
        }
        i++;
    }
    return [jsxElements, shouldBeOneAtLeast]
}

function loopForOneMarker(trees, clee) {
    for (const [index, value] of listDate.entries()) {
        for (let a = 0; a < coords[listDate[index]].length; a++) {
            let icon = value === clee ? coords[listDate[index]][0].icon : coords[listDate[index]][0].iconinactive;
            let idCoords = JSON.stringify(coords[listDate[index]][a].coords);
            let titre = [`${value}`];
            if (!trees.hasOwnProperty(idCoords)) {
                trees[idCoords] = {
                    "popup": [titre],
                    "icon": icon,
                    "name": coords[listDate[index]][a].name,
                    "adresse": coords[listDate[index]][a].adresse,
                    "coords": coords[listDate[index]][a].coords,
                }
            } else {
                trees[idCoords].popup.push(titre);
                if (a < trees[idCoords].rank) {
                    trees[idCoords].rank = a;
                }
            }
        }
    }
    return trees;
}


function loopOnAllMarkers(trees) {
    for (const [index, value] of listDate.entries()) {

        let idCoords = JSON.stringify(coords[listDate[index]][0].coords);
        let titre = [`${value}`];
        if (!trees.hasOwnProperty(idCoords)) {
            trees[idCoords] = {
                "popup": [titre],
                "icon": coords[listDate[index]][0].icon,
                "name": coords[listDate[index]][0].name,
                "adresse": coords[listDate[index]][0].adresse,
                "coords": coords[listDate[index]][0].coords
            }
        }
    }
    return trees;
}

function ListMarkers(props) {

    const ref = props.markerRef;
    const map = useMap();
    const setWarn = props.warning;
    const userLanguage = props.userLanguage;
    const { isTreeUnlocked, setYearselected } = useContext(PinContext);
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT_PX;

    let trees = {};
    if (props.hover !== 0) {
        trees = loopForOneMarker(trees, props.hover);
    } else {
        if (props.askedyear === 0) {
            trees = loopOnAllMarkers(trees);
        } else {
            trees = loopForOneMarker(trees, props.askedyear);
        }
    }

    let arrTrees = constructJsx(trees, map, ref, userLanguage, isTreeUnlocked, setYearselected, isMobileViewport);

    useEffect(() => {
        if (arrTrees[1] === 0) {
            setWarn(true);
        } else {
            setWarn(false);
        }
    });

    useMapEvent('drag', () => {
        let dragTrees = constructJsx(trees, map, ref, userLanguage, isTreeUnlocked, setYearselected, isMobileViewport);
        if (dragTrees[1] === 0) {
            props.warning(true);
        } else {
            props.warning(false);
        }
    })

    useMapEvent('zoomend', () => {
        let zoomTrees = constructJsx(trees, map, ref, userLanguage, isTreeUnlocked, setYearselected, isMobileViewport);
        if (zoomTrees[1] === 0) {
            props.warning(true);
        } else {
            props.warning(false);
        }
    })

    return (
        <>
            {arrTrees[0]}
        </>
    )
}


function MapInitializer({ setMapInstance }) {
    const map = useMap();

    useEffect(() => {
        setMapInstance(map);
    }, [map, setMapInstance]);

    return null;
}

function PopupStateWatcher({ setPopupOpen }) {
    useMapEvent('popupopen', () => {
        setPopupOpen(true);
    });

    useMapEvent('popupclose', () => {
        setPopupOpen(false);
    });

    return null;
}

function FollowMapInteractionWatcher({ isFollowingUser, setIsFollowMapCentered }) {
    const map = useMap();
    const markUserMapInteraction = useCallback(() => {
        if (isFollowingUser) {
            setIsFollowMapCentered(false);
        }
    }, [isFollowingUser, setIsFollowMapCentered]);

    useEffect(() => {
        const container = map.getContainer();
        container.addEventListener('pointerdown', markUserMapInteraction, { passive: true });
        container.addEventListener('touchstart', markUserMapInteraction, { passive: true });
        container.addEventListener('wheel', markUserMapInteraction, { passive: true });

        return () => {
            container.removeEventListener('pointerdown', markUserMapInteraction);
            container.removeEventListener('touchstart', markUserMapInteraction);
            container.removeEventListener('wheel', markUserMapInteraction);
        };
    }, [map, markUserMapInteraction]);

    useMapEvent('dragstart', markUserMapInteraction);
    useMapEvent('zoomstart', markUserMapInteraction);

    return null;
}

function RecenterIcon() {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <path d="M32 6v14" />
            <path d="M32 44v14" />
            <path d="M6 32h14" />
            <path d="M44 32h14" />
            <path d="M32 22l10 10-10 10-10-10z" />
        </svg>
    );
}

const InteractiveMap = () => {
    const { dm, mapData, divWidth, setDivWidth, yearselected, setWarning, tmppins, userLanguage, showClouds, setShowClouds, userPosition, routeToTree, dictionary, setPopupOpen, modalContent, setModalContent, setDm, requestedPopupTreeId, setRequestedPopupTreeId, popupOpen, locateNearestTree, hasUnlockedEveryTree, nearestTreeState, isFollowingUser, isFollowMapCentered, setIsFollowMapCentered, recenterFollowedUser } = useContext(PinContext);

    const [divHeight, setDivHeight] = useState(0);
    const [cityCurrent, setCityCurrent] = useState(null);
    const markerRef = useRef([]);
    const appRef = useRef(null);


    useEffect(() => {
        if (markerRef && markerRef.current && yearselected === 0) {
            Object.values(markerRef.current).forEach((marker) => {
                if (marker) {
                    marker.closePopup();
                }
            });
        }
    }, [yearselected]);

    useEffect(() => {
        if (!requestedPopupTreeId || !mapData.mapObj) {
            return;
        }

        const openRequestedPopup = () => {
            const marker = markerRef.current[requestedPopupTreeId];
            if (marker) {
                marker.openPopup();
                setRequestedPopupTreeId('');
            }
        };

        mapData.mapObj.once('moveend', openRequestedPopup);
        openRequestedPopup();

        return () => {
            mapData.mapObj.off('moveend', openRequestedPopup);
        };
    }, [mapData.mapObj, requestedPopupTreeId, setRequestedPopupTreeId]);


    const handleResize = useCallback(() => {
        setDivWidth(appRef.current.clientWidth);
        setDivHeight(appRef.current.clientHeight);
    }, [setDivWidth]);

    useEffect(() => {
        setDivWidth(appRef.current.clientWidth);
        setDivHeight(appRef.current.clientHeight);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize, setDivWidth]);

    useEffect(() => {
        if (!mapData.mapObj) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            mapData.mapObj.invalidateSize(false);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [mapData.mapObj, divWidth, divHeight]);

    useEffect(() => {
        const controller = new AbortController();

        async function loadCityTemperature() {
            try {
                const cityInfo = await fetchLjubljanaCityInfo(userLanguage, controller.signal);
                setCityCurrent({
                    temperature: cityInfo.current.temperature,
                    weatherCode: cityInfo.current.weatherCode
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setCityCurrent(null);
                }
            }
        }

        loadCityTemperature();

        return () => controller.abort();
    }, [userLanguage]);

    const handleOpenLjubljanaInfo = () => {
        setModalContent('cityInfo');
        if (!dm) {
            setDm(true);
        }
    };

    return (
        <div className="App">
            {(divWidth > 0 && showClouds) && <Cloud widthContainer={divWidth} heightContainer={divHeight} />}
            <div className="mapContainer" ref={appRef}>
                <button
                    type="button"
                    className={`mapCloudTrigger ${showClouds ? 'active' : 'inactif'}`}
                    onClick={() => setShowClouds(!showClouds)}
                    aria-label={showClouds ? 'Hide clouds' : 'Show clouds'}
                    title={showClouds ? 'Hide clouds' : 'Show clouds'}
                />
                <div className="mapCityInfoCluster">
                    {cityCurrent?.temperature != null && (
                        <button
                            type="button"
                            className="mapCityInfoTag"
                            onClick={handleOpenLjubljanaInfo}
                            aria-label={dictionary.cityInfoAction || 'Ljubljana weather and air quality'}
                            title={dictionary.cityInfoAction || 'Ljubljana weather and air quality'}
                        >
                            {divWidth > MOBILE_BREAKPOINT_PX && cityCurrent.weatherCode != null ? <WeatherGlyph weatherCode={cityCurrent.weatherCode} /> : null}
                            <span>{cityCurrent.temperature} {'\u00B0'}C</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="mapCityInfoTag mapCityInfoTag--ellipsis"
                        onClick={handleOpenLjubljanaInfo}
                        aria-label={dictionary.cityInfoAction || 'Ljubljana weather and air quality'}
                        title={dictionary.cityInfoAction || 'Ljubljana weather and air quality'}
                    >
                        ...
                    </button>
                </div>
                {!dm && !popupOpen && hasUnlockedEveryTree && (
                    <button
                        type="button"
                        className="nearestTreeButton nearestTreeButton--desktopOverlay"
                        onClick={locateNearestTree}
                        aria-label={dictionary.nearestTreeAction || 'Find the nearest tree'}
                        title={dictionary.nearestTreeAction || 'Find the nearest tree'}
                    >
                        <WalkingIcon />
                    </button>
                )}
                {nearestTreeState === 'loading' && (
                    <div className="mapLoadingOverlay" aria-hidden="true" />
                )}
                {!dm && isFollowingUser && !isFollowMapCentered && userPosition && (
                    <button
                        type="button"
                        className="followRecenterButton"
                        onClick={recenterFollowedUser}
                        aria-label={dictionary.mapRecenterOnUserAction || 'Recenter on my position'}
                        title={dictionary.mapRecenterOnUserAction || 'Recenter on my position'}
                    >
                        <RecenterIcon />
                    </button>
                )}

                {dm === true &&
                    <div className={`modal${modalContent === 'intro' ? ' modal--intro' : ''}${modalContent === 'about' ? ' modal--about' : ''}${modalContent === 'oxygenInfo' ? ' modal--oxygenInfo' : ''}${modalContent === 'tooFar' || modalContent === 'cityInfo' ? ' modal--compact' : ''}${modalContent === 'treeUnlocked' ? ' modal--unlock' : ''}${modalContent === 'gameVictory' ? ' modal--victory' : ''}${modalContent === 'species' ? ' modal--species' : ''}${modalContent === 'treasure' ? ' modal--treasure' : ''}`}>
                        <Modalcontent />
                    </div>
                }
                <MapContainer center={Ljubljana} zoom={13} scrollWheelZoom={true} tap={false}>
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapInitializer setMapInstance={mapData.setMapObj} />
                    <PopupStateWatcher setPopupOpen={setPopupOpen} />
                    <FollowMapInteractionWatcher isFollowingUser={isFollowingUser} setIsFollowMapCentered={setIsFollowMapCentered} />

                    <ListMarkers hover={tmppins} warning={setWarning} askedyear={yearselected} markerRef={markerRef} userLanguage={userLanguage} />
                    {userPosition && (
                        <CircleMarker
                            center={userPosition}
                            radius={9}
                            pathOptions={{
                                color: '#0f5d2f',
                                fillColor: '#178040',
                                fillOpacity: 1,
                                weight: 3
                            }}
                        >
                            <Popup className="userLocationPopupWrapper" closeButton={false}>
                                <div className="userLocationPopup">
                                    <span className="userLocationPopup__dot" aria-hidden="true" />
                                    <span className="userLocationPopup__label">{dictionary.nearestTreeYouAreHere || 'You are here'}</span>
                                </div>
                            </Popup>
                        </CircleMarker>
                    )}
                    {routeToTree.length > 0 && (
                        <Polyline
                            positions={routeToTree}
                            pathOptions={{
                                color: '#178040',
                                weight: 5,
                                opacity: 0.85,
                                lineCap: 'round',
                                lineJoin: 'round',
                                dashArray: '10 8'
                            }}
                        />
                    )}

                </MapContainer>
            </div>
        </div>
    );
};

export default InteractiveMap;



