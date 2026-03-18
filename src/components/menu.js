import React, { useContext, useCallback, useState, useEffect } from "react";
import trees from "../datas/datas.json";
import { PinContext, Text } from "../store";
import LanguageSelector from './languageSelector.js';
import badge from '../img/badge.png';


const listDate = Object.keys(trees);
const LJUBLJANA_COORDS = [46.0507666, 14.5047565];
const FOOT_ROUTER_BASE_URL = 'https://routing.openstreetmap.de/routed-foot';
const MAX_WALKING_TIME_MINUTES = 120;

function haversineDistanceInKm(fromCoords, toCoords) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371;
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

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateWalkingDistanceInKm(directDistanceInKm) {
    return directDistanceInKm * 1.28;
}

function estimateWalkingTimeInMinutes(distanceInKm) {
    const averageWalkingSpeedKmPerHour = 4.8;
    return Math.max(1, Math.round((distanceInKm / averageWalkingSpeedKmPerHour) * 60));
}

function findNearestTree(userCoords) {
    let nearest = null;

    listDate.forEach((year) => {
        trees[year].forEach((entry, index) => {
            const directDistanceInKm = haversineDistanceInKm(userCoords, entry.coords);

            if (!nearest || directDistanceInKm < nearest.directDistanceInKm) {
                nearest = {
                    year,
                    index,
                    coords: entry.coords,
                    name: entry.name,
                    directDistanceInKm,
                    walkingDistanceInKm: estimateWalkingDistanceInKm(directDistanceInKm),
                };
            }
        });
    });

    if (!nearest) {
        return null;
    }

    return {
        ...nearest,
        walkingTimeInMinutes: estimateWalkingTimeInMinutes(nearest.walkingDistanceInKm),
    };
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

function renderNearestTreeSummary(nearestTree, nearestTreeLabel, dictionary, userLanguage) {
    if (!nearestTree) {
        return null;
    }

    const yearLabel = (dictionary.nearestTreeYearLabel || 'tree of the year {year}')
        .replace('{year}', nearestTree.year);
    const distanceLabel = formatDistance(nearestTree.walkingDistanceInKm, userLanguage);
    const includeWalkingTime = nearestTree.walkingTimeInMinutes <= MAX_WALKING_TIME_MINUTES;

    return (
        <>
            <Text tid="nearestTreeSummaryPrefix" />{' '}
            <span className="nearestTreeMeta">({yearLabel}, {nearestTreeLabel})</span>{' '}
            <Text tid="nearestTreeSummaryDistancePrefix" />{' '}
            {distanceLabel}
            {includeWalkingTime && (
                <>
                    {', '}
                    <Text tid="nearestTreeSummaryTimePrefix" />{' '}
                    {nearestTree.walkingTimeInMinutes} <Text tid="nearestTreeMinutes" />
                </>
            )}
            .
        </>
    );
}

async function fetchWalkingRoute(startCoords, endCoords) {
    const [startLat, startLng] = startCoords;
    const [endLat, endLng] = endCoords;
    const routeUrl = `${FOOT_ROUTER_BASE_URL}/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(routeUrl);

    if (!response.ok) {
        throw new Error('route-request-failed');
    }

    const data = await response.json();
    const route = data && data.routes ? data.routes[0] : null;
    const startWaypoint = data && data.waypoints ? data.waypoints[0] : null;
    const endWaypoint = data && data.waypoints ? data.waypoints[1] : null;
    const hasRouteGeometry = route && route.geometry && route.geometry.coordinates && route.geometry.coordinates.length;
    const hasStartLocation = startWaypoint && startWaypoint.location && startWaypoint.location.length;
    const hasEndLocation = endWaypoint && endWaypoint.location && endWaypoint.location.length;

    if (!route || !hasRouteGeometry || !hasStartLocation || !hasEndLocation) {
        throw new Error('route-not-found');
    }

    const [snappedStartLng, snappedStartLat] = startWaypoint.location;
    const [snappedEndLng, snappedEndLat] = endWaypoint.location;

    return {
        coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceInKm: route.distance / 1000,
        durationInMinutes: Math.max(1, Math.round(route.duration / 60)),
        snappedStart: [snappedStartLat, snappedStartLng],
        snappedEnd: [snappedEndLat, snappedEndLng],
        startSnapDistanceInMeters: startWaypoint.distance,
        endSnapDistanceInMeters: endWaypoint.distance
    };
}

const ListByYears = (props) => {
    const [setYearselected, yearselected, mapData] = props.actions;
    const setTmppins = props.hover;


    const years = [];
    for (const [index, value] of listDate.entries()) {
        years.push(
            <li
                className={yearselected === value ? "active" : ""}
                key={index}
                onPointerMove={() => setTmppins(value)}
                onPointerOut={() => setTmppins(0)}
                onClick={() => {
                    if (value === yearselected) {
                        setYearselected(0);
                        mapData.goToArea(LJUBLJANA_COORDS, 13);
                    } else {
                        setYearselected(value);
                        const goToLngLt = trees[value][0].coords;
                        mapData.goToArea(goToLngLt, 16);
                    };
                }}>
                {value}
            </li>
        );
    }
    return <ul>{years}</ul>;
};

const Col = () => {
    const [circles, setCircles] = useState([]);
    const [nearestTree, setNearestTree] = useState(null);
    const [nearestTreeState, setNearestTreeState] = useState('idle');
    const { setDm, dm, setYearselected, setShowClouds, showClouds, setModalContent, setTmppins, yearselected, mapData, dictionary, userLanguage, setUserPosition, setRouteToTree, setRouteMeta } = useContext(PinContext);

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

    const handleLocateNearestTree = useCallback(() => {
        if (!navigator.geolocation) {
            setNearestTree(null);
            setNearestTreeState('unsupported');
            setUserPosition(null);
            setRouteToTree([]);
            setRouteMeta(null);
            return;
        }

        setNearestTreeState('loading');

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const currentUserPosition = [coords.latitude, coords.longitude];
                const closest = findNearestTree([coords.latitude, coords.longitude]);

                if (!closest) {
                    setNearestTree(null);
                    setNearestTreeState('error');
                    setUserPosition(currentUserPosition);
                    setRouteToTree([]);
                    setRouteMeta(null);
                    return;
                }

                setUserPosition(currentUserPosition);

                if (closest.walkingTimeInMinutes > MAX_WALKING_TIME_MINUTES) {
                    setNearestTree(closest);
                    setRouteToTree([]);
                    setRouteMeta(null);
                    setNearestTreeState('too-far');
                    setModalContent('tooFar');
                    setDm(true);
                    setYearselected(closest.year);
                    setTmppins(0);
                    mapData.goToArea(closest.coords, 12);
                    return;
                }

                try {
                    const route = await fetchWalkingRoute(currentUserPosition, closest.coords);

                    setNearestTree({
                        ...closest,
                        walkingDistanceInKm: route.distanceInKm,
                        walkingTimeInMinutes: route.durationInMinutes,
                    });
                    setUserPosition(route.snappedStart);
                    setRouteToTree(route.coordinates);
                    setRouteMeta({
                        distanceInKm: route.distanceInKm,
                        durationInMinutes: route.durationInMinutes,
                        startSnapDistanceInMeters: route.startSnapDistanceInMeters,
                        endSnapDistanceInMeters: route.endSnapDistanceInMeters
                    });
                    setNearestTreeState('ready');
                } catch (error) {
                    setNearestTree(closest);
                    setRouteToTree([]);
                    setRouteMeta(null);
                    setNearestTreeState('route-error');
                }

                setYearselected(closest.year);
                setTmppins(0);
                mapData.goToArea(closest.coords, 17);
            },
            (error) => {
                setNearestTree(null);
                setUserPosition(null);
                setRouteToTree([]);
                setRouteMeta(null);

                if (error.code === error.PERMISSION_DENIED) {
                    setNearestTreeState('denied');
                    return;
                }

                setNearestTreeState('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }, [mapData, setDm, setModalContent, setRouteMeta, setRouteToTree, setTmppins, setUserPosition, setYearselected]);

    const nearestTreeLabel = nearestTree ? (dictionary[`adrs${nearestTree.year}`] || nearestTree.year) : '';
    const nearestTreeSummary = renderNearestTreeSummary(nearestTree, nearestTreeLabel, dictionary, userLanguage);


    return (
        <>
            <div className="pannel">
                <LanguageSelector />

                <h1 onClick={() => { setModalContent('about'); if (!dm) setDm(true) }}>
                    <Text tid="titre" />
                    <span className="about">?</span>
                </h1>

                <div className="badgeWrapper">
                    <img src={badge} alt="Ljubljana tree badge" />
                </div>

                <div className="content">
                    <ListByYears actions={[setYearselected, yearselected, mapData]} hover={setTmppins} />
                    <div className="nearestTreeCard">
                        <button type="button" className="nearestTreeButton" onClick={handleLocateNearestTree}>
                            {nearestTreeState === 'loading' ? <Text tid="nearestTreeLoading" /> : <Text tid="nearestTreeAction" />}
                        </button>

                        {nearestTreeState === 'unsupported' && (
                            <p className="nearestTreeStatus">
                                <Text tid="nearestTreeUnsupported" />
                            </p>
                        )}

                        {nearestTreeState === 'denied' && (
                            <p className="nearestTreeStatus">
                                <Text tid="nearestTreeDenied" />
                            </p>
                        )}

                        {nearestTreeState === 'error' && (
                            <p className="nearestTreeStatus">
                                <Text tid="nearestTreeError" />
                            </p>
                        )}

                        {nearestTreeState === 'route-error' && nearestTree && (
                            <div className="nearestTreeStatus nearestTreeResult">
                                <p>{nearestTreeSummary}</p>
                                <p><Text tid="nearestTreeRouteUnavailable" /></p>
                            </div>
                        )}

                        {nearestTreeState === 'too-far' && nearestTree && (
                            <div className="nearestTreeStatus nearestTreeResult">
                                <p>{nearestTreeSummary}</p>
                            </div>
                        )}

                        {nearestTreeState === 'ready' && nearestTree && (
                            <div className="nearestTreeStatus nearestTreeResult">
                                <p>{nearestTreeSummary}</p>
                            </div>
                        )}
                    </div>
                </div>


                <div className="menu">
                    <span onClick={() => { setModalContent('contact'); if (!dm) setDm(true) }}><Text tid="contact" /></span>
                    <span onClick={() => { setShowClouds(!showClouds) }} className={`cloudTrigger ${showClouds ? 'active' : 'inactif'}`}></span>
                </div>

            </div>
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
