import React, { useState, createContext, useRef, useContext, useEffect, useCallback } from "react";
import { languageOptions, dictionaryList } from './datas/languages.js';
import ReactStringReplace from 'react-string-replace';
import trees from './datas/datas.json';

export const PinContext = createContext(null);

const LANGUAGE_FALLBACK = 'fr';
const GAME_STORAGE_KEY = 'drevesa-passport-v1';
const TOTAL_TREE_COUNT = Object.keys(trees).length;
const ALL_TREE_COORDS = Object.values(trees).flatMap((entries) => entries.map((entry) => entry.coords));
const LANGUAGE_ALIASES = {
    si: 'sl'
};
const FOOT_ROUTER_BASE_URL = 'https://routing.openstreetmap.de/routed-foot';
const MAX_WALKING_TIME_MINUTES = 120;
const LJUBLJANA_COORDS = [46.0507666, 14.5047565];
const NEAREST_TREE_ZOOM = 17;
const FOLLOW_USER_ZOOM = 17;
const FOLLOW_ROUTE_RECALC_INTERVAL_MS = 20000;
const FOLLOW_ROUTE_MIN_MOVE_METERS = 15;
const FOLLOW_ROUTE_DEVIATION_THRESHOLD_METERS = 30;
const FOLLOW_AUTO_UNLOCK_DISTANCE_METERS = 20;
const MOBILE_NEAREST_TREE_OFFSET_RATIO = 0.22;
const MOBILE_NEAREST_TREE_MAX_OFFSET_PX = 140;

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

function haversineDistanceInMeters(fromCoords, toCoords) {
    return haversineDistanceInKm(fromCoords, toCoords) * 1000;
}

function projectCoordsToMeters(coords, originLat) {
    const earthRadiusMeters = 6371000;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const [lat, lng] = coords;

    return {
        x: earthRadiusMeters * toRadians(lng) * Math.cos(toRadians(originLat)),
        y: earthRadiusMeters * toRadians(lat)
    };
}

function getDistanceToSegmentInMeters(point, segmentStart, segmentEnd) {
    const originLat = point[0];
    const projectedPoint = projectCoordsToMeters(point, originLat);
    const projectedStart = projectCoordsToMeters(segmentStart, originLat);
    const projectedEnd = projectCoordsToMeters(segmentEnd, originLat);
    const segmentX = projectedEnd.x - projectedStart.x;
    const segmentY = projectedEnd.y - projectedStart.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (segmentLengthSquared === 0) {
        return haversineDistanceInMeters(point, segmentStart);
    }

    const pointRatio = Math.max(
        0,
        Math.min(
            1,
            ((projectedPoint.x - projectedStart.x) * segmentX + (projectedPoint.y - projectedStart.y) * segmentY) / segmentLengthSquared
        )
    );
    const closestPoint = {
        x: projectedStart.x + pointRatio * segmentX,
        y: projectedStart.y + pointRatio * segmentY
    };
    const deltaX = projectedPoint.x - closestPoint.x;
    const deltaY = projectedPoint.y - closestPoint.y;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function getDistanceToRouteInMeters(point, routeCoords) {
    if (!routeCoords || routeCoords.length < 2) {
        return Infinity;
    }

    let shortestDistance = Infinity;

    for (let index = 1; index < routeCoords.length; index++) {
        shortestDistance = Math.min(
            shortestDistance,
            getDistanceToSegmentInMeters(point, routeCoords[index - 1], routeCoords[index])
        );
    }

    return shortestDistance;
}

function getProjectedPointOnSegment(point, segmentStart, segmentEnd) {
    const originLat = point[0];
    const projectedPoint = projectCoordsToMeters(point, originLat);
    const projectedStart = projectCoordsToMeters(segmentStart, originLat);
    const projectedEnd = projectCoordsToMeters(segmentEnd, originLat);
    const segmentX = projectedEnd.x - projectedStart.x;
    const segmentY = projectedEnd.y - projectedStart.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (segmentLengthSquared === 0) {
        return {
            coords: segmentStart,
            distanceInMeters: haversineDistanceInMeters(point, segmentStart)
        };
    }

    const pointRatio = Math.max(
        0,
        Math.min(
            1,
            ((projectedPoint.x - projectedStart.x) * segmentX + (projectedPoint.y - projectedStart.y) * segmentY) / segmentLengthSquared
        )
    );
    const closestPoint = {
        x: projectedStart.x + pointRatio * segmentX,
        y: projectedStart.y + pointRatio * segmentY
    };
    const deltaX = projectedPoint.x - closestPoint.x;
    const deltaY = projectedPoint.y - closestPoint.y;
    const projectedLng = closestPoint.x / (6371000 * Math.cos((originLat * Math.PI) / 180));
    const projectedLat = closestPoint.y / 6371000;

    return {
        coords: [
            (projectedLat * 180) / Math.PI,
            (projectedLng * 180) / Math.PI
        ],
        distanceInMeters: Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    };
}

function getRouteLengthInKm(routeCoords) {
    if (!routeCoords || routeCoords.length < 2) {
        return 0;
    }

    let totalDistance = 0;

    for (let index = 1; index < routeCoords.length; index++) {
        totalDistance += haversineDistanceInKm(routeCoords[index - 1], routeCoords[index]);
    }

    return totalDistance;
}

function getTrimmedRouteFromPoint(point, routeCoords) {
    if (!routeCoords || routeCoords.length < 2) {
        return null;
    }

    let closestSegmentIndex = 1;
    let closestSegmentPoint = routeCoords[0];
    let shortestDistance = Infinity;

    for (let index = 1; index < routeCoords.length; index++) {
        const projectedPoint = getProjectedPointOnSegment(point, routeCoords[index - 1], routeCoords[index]);

        if (projectedPoint.distanceInMeters < shortestDistance) {
            shortestDistance = projectedPoint.distanceInMeters;
            closestSegmentIndex = index;
            closestSegmentPoint = projectedPoint.coords;
        }
    }

    const remainingRoute = [
        point,
        closestSegmentPoint,
        ...routeCoords.slice(closestSegmentIndex)
    ].filter((coords, index, array) => {
        if (index === 0) {
            return true;
        }

        return haversineDistanceInMeters(array[index - 1], coords) > 1;
    });

    return {
        coordinates: remainingRoute,
        distanceInKm: getRouteLengthInKm(remainingRoute)
    };
}

function getNearestTreeVerticalOffset(map) {
    if (typeof window === 'undefined' || !window.matchMedia('(orientation: portrait)').matches) {
        return 0;
    }

    const mapHeight = map.getSize().y;
    return Math.min(
        MOBILE_NEAREST_TREE_MAX_OFFSET_PX,
        Math.max(0, Math.round(mapHeight * MOBILE_NEAREST_TREE_OFFSET_RATIO))
    );
}

function flyToNearestTree(map, coords) {
    const verticalOffset = getNearestTreeVerticalOffset(map);

    if (verticalOffset === 0) {
        map.flyTo(coords, NEAREST_TREE_ZOOM);
        return;
    }

    const targetPoint = map.project(coords, NEAREST_TREE_ZOOM);
    const centerPoint = targetPoint.subtract([0, verticalOffset]);
    map.flyTo(map.unproject(centerPoint, NEAREST_TREE_ZOOM), NEAREST_TREE_ZOOM);
}

function findNearestTree(userCoords) {
    let nearest = null;

    Object.keys(trees).forEach((year) => {
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

function findNearestLockedTree(fromCoords, isTreeUnlocked) {
    let nearest = null;

    Object.keys(trees).forEach((year) => {
        if (isTreeUnlocked(year)) {
            return;
        }

        const entry = trees[year][0];
        const directDistanceInKm = haversineDistanceInKm(fromCoords, entry.coords);

        if (!nearest || directDistanceInKm < nearest.directDistanceInKm) {
            nearest = {
                year,
                coords: entry.coords,
                name: entry.name,
                directDistanceInKm,
                walkingDistanceInKm: estimateWalkingDistanceInKm(directDistanceInKm),
                walkingTimeInMinutes: estimateWalkingTimeInMinutes(estimateWalkingDistanceInKm(directDistanceInKm)),
            };
        }
    });

    return nearest;
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

function readGameState() {
    try {
        const rawValue = window.localStorage.getItem(GAME_STORAGE_KEY);
        if (!rawValue) {
            return { unlockedTrees: [], unlockAllTrees: false };
        }

        const parsedValue = JSON.parse(rawValue);
        return {
            unlockedTrees: Array.isArray(parsedValue.unlockedTrees) ? parsedValue.unlockedTrees : [],
            unlockAllTrees: Boolean(parsedValue.unlockAllTrees)
        };
    } catch (error) {
        return { unlockedTrees: [], unlockAllTrees: false };
    }
}

function persistGameState(nextState) {
    window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(nextState));
}

function normalizeLanguage(language) {
    const sanitizedLanguage = LANGUAGE_ALIASES[language] || language;
    return languageOptions[sanitizedLanguage] ? sanitizedLanguage : null;
}

export function getLanguageFromPathname(pathname) {
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    return normalizeLanguage(firstSegment);
}

export function getLanguagePath(language) {
    return `/${language}`;
}

export function getCurrentLanguage() {
    const languageFromPath = getLanguageFromPathname(window.location.pathname);
    if (languageFromPath) {
        return languageFromPath;
    }

    const browserLanguage = normalizeLanguage(window.navigator.language.substring(0, 2));
    return browserLanguage || LANGUAGE_FALLBACK;
}

export const PinContextProvider = props => {

    const mapRef = useRef();
    const [modalContent, setModalContent] = useState('');
    const [yearselected, setYearselected] = useState(0);
    const [dm, setDm] = useState(false);
    const [warning, setWarning] = useState(false);
    const [tmppins, setTmppins] = useState(0);
    const [showClouds, setShowClouds] = useState(false);
    const [userLanguage, setUserLanguage] = useState(getCurrentLanguage);
    const [divWidth, setDivWidth] = useState(0);
    const [userPosition, setUserPosition] = useState(null);
    const [routeToTree, setRouteToTree] = useState([]);
    const [routeMeta, setRouteMeta] = useState(null);
    const [popupOpen, setPopupOpen] = useState(false);
    const [requestedPopupTreeId, setRequestedPopupTreeId] = useState('');
    const [nearestTree, setNearestTree] = useState(null);
    const [nearestTreeState, setNearestTreeState] = useState('idle');
    const [unlockedTrees, setUnlockedTrees] = useState([]);
    const [unlockAllTrees, setUnlockAllTrees] = useState(false);
    const [nextTreeSuggestion, setNextTreeSuggestion] = useState(null);
    const [gameStateLoaded, setGameStateLoaded] = useState(false);
    const [celebrationKey, setCelebrationKey] = useState(0);
    const [recentlyUnlockedTreeId, setRecentlyUnlockedTreeId] = useState('');
    const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
    const [guidedTreeId, setGuidedTreeId] = useState('');
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [isFollowMapCentered, setIsFollowMapCentered] = useState(true);
    const followWatchIdRef = useRef(null);
    const lastFollowCenterTsRef = useRef(0);
    const isFollowMapCenteredRef = useRef(true);
    const followRouteTargetRef = useRef(null);
    const lastRouteRefreshPositionRef = useRef(null);
    const lastRouteRefreshTsRef = useRef(0);
    const isRouteRefreshPendingRef = useRef(false);
    const routeToTreeRef = useRef([]);
    const nearestTreeRef = useRef(null);
    const nextTreeSuggestionRef = useRef(null);
    const unlockedTreesRef = useRef([]);
    const unlockAllTreesRef = useRef(false);
    const unlockTreeRef = useRef(null);

    const [mapObj, setMapObj] = useState(null);
    const setFollowMapCentered = useCallback((nextValue) => {
        const resolvedValue = typeof nextValue === 'function'
            ? nextValue(isFollowMapCenteredRef.current)
            : nextValue;

        isFollowMapCenteredRef.current = resolvedValue;
        setIsFollowMapCentered(resolvedValue);
    }, []);

    const goToArea = (regionCoord, zoom = 13) => {
        setIsFollowingUser(false);
        if (mapObj) {
            mapObj.flyTo(regionCoord, zoom);
        }
    };

    const mapData = {
        mapObj: mapObj,
        setMapObj: setMapObj,
        goToArea: goToArea
    }

    useEffect(() => {
        routeToTreeRef.current = routeToTree;
    }, [routeToTree]);

    useEffect(() => {
        nearestTreeRef.current = nearestTree;
    }, [nearestTree]);

    useEffect(() => {
        nextTreeSuggestionRef.current = nextTreeSuggestion;
    }, [nextTreeSuggestion]);

    useEffect(() => {
        unlockedTreesRef.current = unlockedTrees;
    }, [unlockedTrees]);

    useEffect(() => {
        unlockAllTreesRef.current = unlockAllTrees;
    }, [unlockAllTrees]);

    useEffect(() => {
        isFollowMapCenteredRef.current = isFollowMapCentered;
    }, [isFollowMapCentered]);

    const maybeRefreshFollowRoute = useCallback(async (nextPosition) => {
        const target = followRouteTargetRef.current;

        if (!target || isRouteRefreshPendingRef.current) {
            return;
        }

        const hasCurrentRoute = routeToTreeRef.current && routeToTreeRef.current.length >= 2;
        const now = Date.now();
        if (hasCurrentRoute && now - lastRouteRefreshTsRef.current < FOLLOW_ROUTE_RECALC_INTERVAL_MS) {
            return;
        }

        const lastRouteRefreshPosition = lastRouteRefreshPositionRef.current;
        if (
            hasCurrentRoute &&
            lastRouteRefreshPosition &&
            haversineDistanceInMeters(lastRouteRefreshPosition, nextPosition) < FOLLOW_ROUTE_MIN_MOVE_METERS
        ) {
            return;
        }

        if (hasCurrentRoute) {
            const distanceToCurrentRoute = getDistanceToRouteInMeters(nextPosition, routeToTreeRef.current);
            if (distanceToCurrentRoute <= FOLLOW_ROUTE_DEVIATION_THRESHOLD_METERS) {
                return;
            }
        }

        isRouteRefreshPendingRef.current = true;
        lastRouteRefreshTsRef.current = now;

        try {
            const route = await fetchWalkingRoute(nextPosition, target.coords);
            if (followRouteTargetRef.current !== target) {
                return;
            }

            const nextRouteMeta = {
                distanceInKm: route.distanceInKm,
                durationInMinutes: route.durationInMinutes,
                startSnapDistanceInMeters: route.startSnapDistanceInMeters,
                endSnapDistanceInMeters: route.endSnapDistanceInMeters
            };

            lastRouteRefreshPositionRef.current = nextPosition;
            routeToTreeRef.current = route.coordinates;
            setRouteToTree(route.coordinates);
            setRouteMeta(nextRouteMeta);

            setNearestTree((currentNearestTree) => {
                if (!currentNearestTree || currentNearestTree.year !== target.year) {
                    return currentNearestTree;
                }

                return {
                    ...currentNearestTree,
                    directDistanceInKm: haversineDistanceInKm(nextPosition, target.coords),
                    walkingDistanceInKm: route.distanceInKm,
                    walkingTimeInMinutes: route.durationInMinutes
                };
            });

            setNextTreeSuggestion((currentSuggestion) => {
                if (!currentSuggestion) {
                    return {
                        year: target.year,
                        coords: target.coords,
                        directDistanceInKm: haversineDistanceInKm(nextPosition, target.coords),
                        walkingDistanceInKm: route.distanceInKm,
                        walkingTimeInMinutes: route.durationInMinutes
                    };
                }

                if (currentSuggestion.year !== target.year) {
                    return currentSuggestion;
                }

                return {
                    ...currentSuggestion,
                    directDistanceInKm: haversineDistanceInKm(nextPosition, target.coords),
                    walkingDistanceInKm: route.distanceInKm,
                    walkingTimeInMinutes: route.durationInMinutes
                };
            });
        } catch (error) {
            // Keep the previous route if rerouting fails; the next eligible GPS update can retry.
        } finally {
            isRouteRefreshPendingRef.current = false;
        }
    }, []);

    const updateFollowedUserPosition = useCallback((coords) => {
        const nextPosition = [coords.latitude, coords.longitude];
        const followTarget = followRouteTargetRef.current;
        setUserPosition(nextPosition);

        if (followTarget && routeToTreeRef.current && routeToTreeRef.current.length >= 2) {
            const trimmedRoute = getTrimmedRouteFromPoint(nextPosition, routeToTreeRef.current);

            if (trimmedRoute) {
                routeToTreeRef.current = trimmedRoute.coordinates;
                setRouteToTree(trimmedRoute.coordinates);

                const nextDurationInMinutes = estimateWalkingTimeInMinutes(trimmedRoute.distanceInKm);
                setRouteMeta((currentRouteMeta) => currentRouteMeta ? {
                    ...currentRouteMeta,
                    distanceInKm: trimmedRoute.distanceInKm,
                    durationInMinutes: nextDurationInMinutes
                } : currentRouteMeta);

                setNearestTree((currentNearestTree) => {
                    if (!currentNearestTree || currentNearestTree.year !== followTarget.year) {
                        return currentNearestTree;
                    }

                    return {
                        ...currentNearestTree,
                        directDistanceInKm: haversineDistanceInKm(nextPosition, followTarget.coords),
                        walkingDistanceInKm: trimmedRoute.distanceInKm,
                        walkingTimeInMinutes: nextDurationInMinutes
                    };
                });

                setNextTreeSuggestion((currentSuggestion) => {
                    if (!currentSuggestion || currentSuggestion.year !== followTarget.year) {
                        return currentSuggestion;
                    }

                    return {
                        ...currentSuggestion,
                        directDistanceInKm: haversineDistanceInKm(nextPosition, followTarget.coords),
                        walkingDistanceInKm: trimmedRoute.distanceInKm,
                        walkingTimeInMinutes: nextDurationInMinutes
                    };
                });
            }
        }

        maybeRefreshFollowRoute(nextPosition);

        if (
            followTarget &&
            !unlockAllTreesRef.current &&
            !unlockedTreesRef.current.includes(followTarget.year) &&
            haversineDistanceInMeters(nextPosition, followTarget.coords) <= FOLLOW_AUTO_UNLOCK_DISTANCE_METERS
        ) {
            setIsFollowingUser(false);
            if (unlockTreeRef.current) {
                unlockTreeRef.current(followTarget.year);
            }
            return;
        }

        if (!mapObj || !isFollowMapCenteredRef.current) {
            return;
        }

        const now = Date.now();
        if (now - lastFollowCenterTsRef.current < 1000) {
            return;
        }

        lastFollowCenterTsRef.current = now;
        const nextZoom = Math.max(mapObj.getZoom(), FOLLOW_USER_ZOOM);
        mapObj.setView(nextPosition, nextZoom, { animate: true });
    }, [mapObj, maybeRefreshFollowRoute]);

    useEffect(() => {
        if (!isFollowingUser) {
            if (followWatchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
                navigator.geolocation.clearWatch(followWatchIdRef.current);
                followWatchIdRef.current = null;
            }
            followRouteTargetRef.current = null;
            lastRouteRefreshPositionRef.current = null;
            isRouteRefreshPendingRef.current = false;
            setFollowMapCentered(true);
            return undefined;
        }

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setIsFollowingUser(false);
            return undefined;
        }

        followWatchIdRef.current = navigator.geolocation.watchPosition(
            ({ coords: currentCoords }) => {
                updateFollowedUserPosition(currentCoords);
            },
            (error) => {
                if (error && error.code === error.PERMISSION_DENIED) {
                    setIsFollowingUser(false);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 5000
            }
        );

        return () => {
            if (followWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(followWatchIdRef.current);
                followWatchIdRef.current = null;
            }
        };
    }, [isFollowingUser, setFollowMapCentered, updateFollowedUserPosition]);

    const startFollowingUser = useCallback((target = null) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setNearestTreeState('unsupported');
            return;
        }

        const nearestTarget = nearestTreeRef.current
            ? { year: nearestTreeRef.current.year, coords: nearestTreeRef.current.coords }
            : null;
        const nextSuggestionTarget = nextTreeSuggestionRef.current
            ? { year: nextTreeSuggestionRef.current.year, coords: nextTreeSuggestionRef.current.coords }
            : null;
        const followTarget = target || nearestTarget || nextSuggestionTarget;
        const hasExistingRouteToTarget = Boolean(
            followTarget &&
            routeToTreeRef.current.length > 1 &&
            (
                nearestTreeRef.current?.year === followTarget.year ||
                nextTreeSuggestionRef.current?.year === followTarget.year
            )
        );
        followRouteTargetRef.current = followTarget;
        routeToTreeRef.current = hasExistingRouteToTarget ? routeToTreeRef.current : [];
        lastRouteRefreshPositionRef.current = null;
        lastRouteRefreshTsRef.current = hasExistingRouteToTarget ? Date.now() : 0;
        isRouteRefreshPendingRef.current = false;
        if (!hasExistingRouteToTarget) {
            setRouteToTree([]);
            setRouteMeta(null);
        }
        if (
            followTarget &&
            nearestTreeRef.current?.year !== followTarget.year &&
            nextTreeSuggestionRef.current?.year !== followTarget.year
        ) {
            const nextFollowSuggestion = {
                year: followTarget.year,
                coords: followTarget.coords,
                directDistanceInKm: userPosition ? haversineDistanceInKm(userPosition, followTarget.coords) : null
            };
            nextTreeSuggestionRef.current = nextFollowSuggestion;
            setNextTreeSuggestion(nextFollowSuggestion);
        }
        setGuidedTreeId(followTarget ? followTarget.year : '');
        setFollowMapCentered(true);
        setIsFollowingUser(true);
        if (mapObj) {
            mapObj.closePopup();
            if (userPosition) {
                mapObj.flyTo(userPosition, FOLLOW_USER_ZOOM);
            }
        }

        if (userPosition && followTarget) {
            maybeRefreshFollowRoute(userPosition);
        }
    }, [mapObj, maybeRefreshFollowRoute, setFollowMapCentered, userPosition]);

    const recenterFollowedUser = useCallback(() => {
        setFollowMapCentered(true);

        if (mapObj && userPosition) {
            mapObj.flyTo(userPosition, Math.max(mapObj.getZoom(), FOLLOW_USER_ZOOM));
        }
    }, [mapObj, setFollowMapCentered, userPosition]);

    const focusAllTrees = useCallback(() => {
        if (!mapObj || ALL_TREE_COORDS.length === 0) {
            return;
        }

        setIsFollowingUser(false);
        mapObj.closePopup();
        mapObj.flyToBounds(ALL_TREE_COORDS, {
            padding: [48, 48],
            maxZoom: 13
        });
    }, [mapObj]);
    const pathnameLanguage = getLanguageFromPathname(window.location.pathname);
    const activeLanguage = pathnameLanguage || userLanguage;

    useEffect(() => {
        if (!pathnameLanguage) {
            return;
        }

        if (userLanguage !== pathnameLanguage) {
            setUserLanguage(pathnameLanguage);
        }
    }, [pathnameLanguage, userLanguage]);

    useEffect(() => {
        const currentPath = window.location.pathname;
        const currentLanguagePath = getLanguagePath(activeLanguage);
        const normalizedPath = currentPath === '/si' || currentPath === '/si/' ? '/sl' : currentPath;
        const hasLanguageInPath = Boolean(getLanguageFromPathname(normalizedPath));

        if (currentPath !== normalizedPath) {
            window.history.replaceState({}, '', normalizedPath);
        } else if (!hasLanguageInPath && normalizedPath !== currentLanguagePath && normalizedPath !== `${currentLanguagePath}/`) {
            window.history.replaceState({}, '', currentLanguagePath);
        }
    }, [activeLanguage, pathnameLanguage]);

    useEffect(() => {
        const handlePopState = () => {
            const languageFromPath = getLanguageFromPathname(window.location.pathname);
            if (languageFromPath) {
                setUserLanguage(languageFromPath);
                return;
            }

            setUserLanguage(getCurrentLanguage());
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap') {
            return;
        }

        const initialGameState = readGameState();
        setUnlockedTrees(initialGameState.unlockedTrees);
        setUnlockAllTrees(initialGameState.unlockAllTrees);
        setGameStateLoaded(true);
    }, []);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap') {
            return;
        }

        if (!gameStateLoaded) {
            return;
        }

        if (unlockAllTrees || unlockedTrees.length > 0) {
            return;
        }

        setModalContent('intro');
        setDm(true);
    }, [gameStateLoaded, unlockAllTrees, unlockedTrees.length]);

    const unlockTree = (treeId) => {
        setUnlockedTrees((currentUnlockedTrees) => {
            if (currentUnlockedTrees.includes(treeId)) {
                return currentUnlockedTrees;
            }

            const nextUnlockedTrees = [...currentUnlockedTrees, treeId];
            const hasUnlockedEveryTree = nextUnlockedTrees.length >= TOTAL_TREE_COUNT;
            persistGameState({ unlockedTrees: nextUnlockedTrees, unlockAllTrees });
            setRecentlyUnlockedTreeId(treeId);
            setGuidedTreeId('');
            setModalContent(hasUnlockedEveryTree ? 'gameVictory' : 'treeUnlocked');
            setDm(true);
            if (hasUnlockedEveryTree) {
                setNextTreeSuggestion(null);
            }
            setCelebrationKey((currentKey) => currentKey + 1);
            return nextUnlockedTrees;
        });
    };
    unlockTreeRef.current = unlockTree;

    const unlockEveryTree = () => {
        setUnlockAllTrees(true);
        setNextTreeSuggestion(null);
        persistGameState({ unlockedTrees, unlockAllTrees: true });
    };

    const resetUnlockedPassport = () => {
        setUnlockAllTrees(false);
        setUnlockedTrees([]);
        setNextTreeSuggestion(null);
        persistGameState({ unlockedTrees: [], unlockAllTrees: false });
    };

    const isTreeUnlocked = (treeId) => unlockAllTrees || unlockedTrees.includes(treeId);
    const hasUnlockedEveryTree = unlockAllTrees || unlockedTrees.length >= TOTAL_TREE_COUNT;

    const openSpeciesModal = useCallback((speciesId) => {
        if (!speciesId) {
            return;
        }

        setSelectedSpeciesId(speciesId);
        setModalContent('species');
        setDm(true);
    }, []);

    const traceNextLockedTreeFrom = useCallback(async (fromTreeId) => {
        setIsFollowingUser(false);
        const fromTree = trees[fromTreeId] && trees[fromTreeId][0];
        const currentPosition = userPosition || (fromTree ? fromTree.coords : null);

        if (!currentPosition) {
            return null;
        }

        const nextTree = findNearestLockedTree(
            fromTree ? fromTree.coords : currentPosition,
            (treeId) => unlockAllTrees || unlockedTrees.includes(treeId)
        );

        if (!nextTree) {
            setNextTreeSuggestion(null);
            setRouteToTree([]);
            setRouteMeta(null);
            setYearselected(0);
            setRequestedPopupTreeId('');
            setGuidedTreeId('');
            return null;
        }

        setNextTreeSuggestion(nextTree);
        setGuidedTreeId(nextTree.year);
        setYearselected(nextTree.year);
        setRequestedPopupTreeId(nextTree.year);

        try {
            const route = await fetchWalkingRoute(currentPosition, nextTree.coords);
            setUserPosition(route.snappedStart);
            setRouteToTree(route.coordinates);
            setRouteMeta({
                distanceInKm: route.distanceInKm,
                durationInMinutes: route.durationInMinutes,
                startSnapDistanceInMeters: route.startSnapDistanceInMeters,
                endSnapDistanceInMeters: route.endSnapDistanceInMeters
            });

            if (mapObj) {
                mapObj.flyToBounds([route.snappedStart, nextTree.coords], {
                    padding: [60, 60],
                    maxZoom: 16
                });
            }
        } catch (error) {
            setRouteToTree([]);
            setRouteMeta(null);
            if (mapObj) {
                mapObj.flyToBounds([currentPosition, nextTree.coords], {
                    padding: [60, 60],
                    maxZoom: 16
                });
            }
        }

        return nextTree;
    }, [mapObj, unlockAllTrees, unlockedTrees, userPosition]);

    const locateNearestTree = useCallback(() => {
        setIsFollowingUser(false);
        setNextTreeSuggestion(null);
        setNearestTreeState('loading');
        setYearselected(0);
        setRequestedPopupTreeId('');
        setGuidedTreeId('');
        if (mapObj) {
            mapObj.closePopup();
        }

        const proceedWithPosition = async (currentUserPosition) => {
            const closest = findNearestTree(currentUserPosition);

            if (!closest) {
                setNearestTree(null);
                setNearestTreeState('error');
                setUserPosition(currentUserPosition);
                setRouteToTree([]);
                setRouteMeta(null);
                setYearselected(0);
                setRequestedPopupTreeId('');
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
                    setYearselected(0);
                    setRequestedPopupTreeId('');
                    setTmppins(0);
                    if (mapObj) {
                        mapObj.flyTo(currentUserPosition, 14);
                    }
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
            setRequestedPopupTreeId(closest.year);
            setTmppins(0);
            if (mapObj) {
                flyToNearestTree(mapObj, closest.coords);
            }
        };

        if (!navigator.geolocation) {
            if (userPosition) {
                proceedWithPosition(userPosition);
                return;
            }

            setNearestTree(null);
            setNearestTreeState('unsupported');
            setRouteToTree([]);
            setRouteMeta(null);
            setYearselected(0);
            setRequestedPopupTreeId('');
            setGuidedTreeId('');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const currentUserPosition = [coords.latitude, coords.longitude];
                await proceedWithPosition(currentUserPosition);
            },
            (error) => {
                if (userPosition) {
                    proceedWithPosition(userPosition);
                    return;
                }

                setNearestTree(null);
                setRouteToTree([]);
                setRouteMeta(null);
                setYearselected(0);
                setRequestedPopupTreeId('');
                setGuidedTreeId('');

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
    }, [mapObj, userPosition]);

    const provider = {
        dm,
        setDm,
        mapRef,
        mapData,
        focusAllTrees,
        warning,
        goToArea,
        setWarning,
        userLanguage: activeLanguage,
        userPosition, setUserPosition,
        isFollowingUser, setIsFollowingUser,
        isFollowMapCentered, setIsFollowMapCentered: setFollowMapCentered,
        startFollowingUser,
        recenterFollowedUser,
        routeToTree, setRouteToTree,
        routeMeta, setRouteMeta,
        popupOpen, setPopupOpen,
        guidedTreeId, setGuidedTreeId,
        requestedPopupTreeId, setRequestedPopupTreeId,
        nearestTree, setNearestTree,
        nearestTreeState, setNearestTreeState,
        locateNearestTree,
        nextTreeSuggestion, setNextTreeSuggestion,
        traceNextLockedTreeFrom,
        celebrationKey,
        recentlyUnlockedTreeId, setRecentlyUnlockedTreeId,
        selectedSpeciesId, setSelectedSpeciesId,
        unlockedTrees, setUnlockedTrees,
        unlockAllTrees,
        hasUnlockedEveryTree,
        unlockTree,
        unlockEveryTree,
        resetUnlockedPassport,
        isTreeUnlocked,
        gameDistanceThresholdMeters: 20,
        ljubljanaCoords: LJUBLJANA_COORDS,
        tmppins, setTmppins,
        divWidth, setDivWidth,
        showClouds, setShowClouds,
        modalContent, setModalContent,
        openSpeciesModal,
        yearselected, setYearselected,
        dictionary: dictionaryList[activeLanguage],
        userLanguageChange: selected => {
            const newLanguage = normalizeLanguage(selected) || LANGUAGE_FALLBACK;
            setUserLanguage(newLanguage);
            window.history.pushState({}, '', getLanguagePath(newLanguage));
        }
    };

    return (
        <PinContext.Provider value={provider}>
            {props.children}
        </PinContext.Provider>
    );
};

export function Text({ tid, classLink, as: Wrapper = 'div' }) {
    const languageContext = useContext(PinContext);

    let str = languageContext.dictionary[tid] ? languageContext.dictionary[tid] : "";

    const matchGlobal = str.match(/\[a href='(.*?)'\](.*?)\[\/a\]|\[strong\](.*?)\[\/strong\]|\[lang=['"](.*?)['"]\](.*?)\[\/lang\]|\[br\]/g);

    if (matchGlobal) {
        let replaced = str;
        matchGlobal.forEach((match) => {
            // console.log("matchGlobal", match);
            let regexLink = /\[a href='(.*?)'\](.*?)\[\/a\]/;
            let regexStrong = /\[strong\](.*?)\[\/strong\]/;
            let regexLang = /\[lang=['"](.*?)['"]\](.*?)\[\/lang\]/;
            let regexBr = /\[br\]/;
            if (regexLink.test(match)) {
                const [, link, text] = match.match(regexLink);
                replaced = ReactStringReplace(replaced, match, () => {
                    return <a target="blank" className={classLink} href={link}>{text}</a>
                });
            };
            if (regexStrong.test(match)) {
                const [, text] = match.match(regexStrong);
                replaced = ReactStringReplace(replaced, match, () => {
                    return <strong>{text}</strong>
                });
            };
            if (regexLang.test(match)) {
                const [, lang, text] = match.match(regexLang);
                replaced = ReactStringReplace(replaced, match, () => {
                    return <span lang={lang}>{text}</span>
                });
            };
            if (regexBr.test(match)) {
                replaced = ReactStringReplace(replaced, match, () => {
                    return <><br /></>
                });
            }
        });
        const result = React.Children.toArray(replaced);
        return <Wrapper>{result}</Wrapper>
    }
    return <>{str}</>;

};

export function FuncText(tid) {
    const lang = getCurrentLanguage();
    let str = dictionaryList[lang][tid] ? dictionaryList[lang][tid] : "";
    return str;
};




