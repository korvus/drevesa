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
import "leaflet/dist/leaflet.css";
import Modalcontent from './modal.js';
import coords from '../datas/datas.json';
import { PinContext, Text } from '../store';
import { useEffect, useRef, useContext, useState, useCallback } from "react";
import { getIcon } from '../components/icon.js';
import speciesDetails from '../datas/speciesDetails.js';
import herbierFerme from '../img/herbierFerme.png';
import treasure from '../img/treasure.png';
import carteExplication from '../img/carteExplication.png';

const Ljubljana = [46.0507666, 14.5047565];
const listDate = Object.keys(coords);
const GAME_DISTANCE_THRESHOLD_METERS = 20;

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

function LockedTreePopup({ treeId, coords }) {
    const { userPosition, setUserPosition, unlockTree, guidedTreeId, nearestTree, mapData } = useContext(PinContext);
    const [distanceInMeters, setDistanceInMeters] = useState(null);
    const [geoStatus, setGeoStatus] = useState('idle');
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
    const shouldShowGoThere = !isNearby && (isGuidedTree || isNearestTree);
    const estimatedWalkingMinutes = distanceInMeters !== null
        ? Math.max(1, Math.round(((distanceInMeters / 1000) / 4.8) * 60))
        : null;

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

    const handleUseLocation = () => {
        if (!navigator.geolocation) {
            setGeoStatus('unsupported');
            return;
        }

        setGeoStatus('loading');
        navigator.geolocation.getCurrentPosition(
            ({ coords: currentCoords }) => {
                setUserPosition([currentCoords.latitude, currentCoords.longitude]);
                setGeoStatus('ready');
            },
            () => {
                setGeoStatus('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    };

    const handleGoThere = () => {
        if (!mapData.mapObj) {
            return;
        }

        if (userPosition) {
            mapData.mapObj.closePopup();
            mapData.mapObj.flyTo(userPosition, 17);
            return;
        }

        mapData.mapObj.closePopup();
        mapData.mapObj.flyTo(coords, 17);
    };

    return (
        <div className="gamePopup">
            <span className="title">{treeId}</span>
            <p><Text tid="gameLockedIntro" /></p>
            {distanceInMeters !== null && (
                <p className="popupMetric">
                    <Text tid="gameLockedDistance" /> {distanceInMeters} m.
                </p>
            )}
            {estimatedWalkingMinutes !== null && (
                <p className="popupMetric">
                    <Text tid="gameLockedDuration" /> {estimatedWalkingMinutes} <Text tid="nearestTreeMinutes" />.
                </p>
            )}
            {shouldShowGoThere && (
                <button type="button" className="gamePopupButton gamePopupButton--secondary" onClick={handleGoThere}>
                    <Text tid="gameGoThere" />
                </button>
            )}
            {isNearby ? (
                <button type="button" className="gamePopupButton" onClick={() => unlockTree(treeId)}>
                    <Text tid="gameUnlockCta" />
                </button>
            ) : !shouldShowGoThere ? (
                <button type="button" className="gamePopupButton gamePopupButton--secondary" onClick={handleUseLocation}>
                    {geoStatus === 'loading' ? <Text tid="nearestTreeLoading" /> : <Text tid="gameUseLocation" />}
                </button>
            ) : null}
            {distanceInMeters !== null && !isNearby && (
                <p><Text tid="gameNeedCloser" /></p>
            )}
            {geoStatus === 'unsupported' && <p><Text tid="nearestTreeUnsupported" /></p>}
            {geoStatus === 'error' && <p><Text tid="nearestTreeError" /></p>}
        </div>
    );
}

function UnlockedTreePopup({ treeId, treeData, userLanguage }) {
    const { traceNextLockedTreeFrom, openSpeciesModal, dictionary, isTreeUnlocked, setModalContent, setDm } = useContext(PinContext);
    const [traceState, setTraceState] = useState('idle');
    const speciesData = speciesDetails[treeData.name];
    const hasRemainingLockedTrees = listDate.some((year) => !isTreeUnlocked(year));

    const handleTraceNextTree = async () => {
        setTraceState('loading');
        const nextTree = await traceNextLockedTreeFrom(treeId);
        setTraceState(nextTree ? 'ready' : 'done');
    };

    const handleOpenTreasure = () => {
        setModalContent('treasure');
        setDm(true);
    };

    return (
        <>
            <span className="title">{treeId}</span>
            <div className="unlockedPopupBody">
                <div className="popupField popupField--species">
                    <div className="popupFieldValue">
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

function constructJsx(trees, map, markerRef, userLanguage, isTreeUnlocked, setYearselected) {
    const jsxElements = [];
    let i = 0;
    let shouldBeOneAtLeast = 0;
    for (var tree in trees) {

        const title = String(trees[tree].popup[0]);

        if (trees.hasOwnProperty(tree)) {
            const unlocked = isTreeUnlocked(title);
            const icone = getIcon(unlocked ? trees[tree].icon : 'questionMarkTree');

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
                    <Popup maxWidth={264} minWidth={0}>
                        {unlocked ? (
                            <UnlockedTreePopup treeId={title} treeData={trees[tree]} userLanguage={userLanguage} />
                        ) : (
                            <LockedTreePopup treeId={title} coords={trees[tree].coords} />
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

    let arrTrees = constructJsx(trees, map, ref, userLanguage, isTreeUnlocked, setYearselected);

    useEffect(() => {
        if (arrTrees[1] === 0) {
            setWarn(true);
        } else {
            setWarn(false);
        }
    });

    useMapEvent('drag', () => {
        let dragTrees = constructJsx(trees, map, ref, userLanguage, isTreeUnlocked, setYearselected);
        if (dragTrees[1] === 0) {
            props.warning(true);
        } else {
            props.warning(false);
        }
    })

    useMapEvent('zoomend', () => {
        let zoomTrees = constructJsx(trees, map, ref, userLanguage, isTreeUnlocked, setYearselected);
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

const InteractiveMap = () => {
    const { dm, mapData, divWidth, setDivWidth, yearselected, setWarning, tmppins, userLanguage, showClouds, setShowClouds, userPosition, routeToTree, dictionary, setPopupOpen, modalContent, requestedPopupTreeId, setRequestedPopupTreeId, popupOpen, locateNearestTree, hasUnlockedEveryTree } = useContext(PinContext);

    const [divHeight, setDivHeight] = useState(0);
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

                {dm === true &&
                    <div className={`modal${modalContent === 'intro' ? ' modal--intro' : ''}${modalContent === 'about' ? ' modal--about' : ''}${modalContent === 'tooFar' ? ' modal--compact' : ''}${modalContent === 'treeUnlocked' ? ' modal--unlock' : ''}${modalContent === 'gameVictory' ? ' modal--victory' : ''}${modalContent === 'species' ? ' modal--species' : ''}${modalContent === 'treasure' ? ' modal--treasure' : ''}`}>
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
