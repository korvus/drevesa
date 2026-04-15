import React, { useContext, useCallback, useState, useEffect } from "react";
import trees from "../datas/datas.json";
import { PinContext, Text } from "../store";
import LanguageSelector from './languageSelector.js';
import badge from '../img/badge.png';
import coupe from '../img/coupe.png';
import treasure from '../img/treasure.png';


const listDate = Object.keys(trees);
const LJUBLJANA_COORDS = [46.0507666, 14.5047565];
const MAX_WALKING_TIME_MINUTES = 120;

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
            <strong>{distanceLabel}</strong>
            {includeWalkingTime && (
                <>
                    {', '}
                    <Text tid="nearestTreeSummaryTimePrefix" />{' '}
                    <strong>{nearestTree.walkingTimeInMinutes} <Text tid="nearestTreeMinutes" /></strong>
                </>
            )}
            .
        </>
    );
}

function renderNearestTreeFeedbackContent(nearestTreeState, nearestTree, nearestTreeSummary) {
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
                <p>{nearestTreeSummary}</p>
                <p><Text tid="nearestTreeRouteUnavailable" /></p>
            </div>
        );
    }

    if (nearestTreeState === 'too-far' && nearestTree) {
        return (
            <div className="nearestTreeStatus nearestTreeResult">
                <p>{nearestTreeSummary}</p>
            </div>
        );
    }

    if (nearestTreeState === 'ready' && nearestTree) {
        return (
            <div className="nearestTreeStatus nearestTreeResult">
                <p>{nearestTreeSummary}</p>
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
    const { setDm, dm, setYearselected, setShowClouds, showClouds, setModalContent, setTmppins, yearselected, mapData, dictionary, userLanguage, popupOpen, nearestTree, nearestTreeState, locateNearestTree, focusAllTrees, isTreeUnlocked, guidedTreeId } = useContext(PinContext);

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

    const nearestTreeLabel = nearestTree ? (dictionary[`adrs${nearestTree.year}`] || nearestTree.year) : '';
    const nearestTreeSummary = renderNearestTreeSummary(nearestTree, nearestTreeLabel, dictionary, userLanguage);
    const nearestTreeFeedback = renderNearestTreeFeedbackContent(nearestTreeState, nearestTree, nearestTreeSummary);
    const hasUnlockedEveryTree = listDate.every((year) => isTreeUnlocked(year));

    useEffect(() => {
        setIsNearestTreeFloatingDismissed(false);
    }, [
        nearestTreeState,
        nearestTree?.year,
        nearestTree?.walkingDistanceInKm,
        nearestTree?.walkingTimeInMinutes
    ]);

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
                                <button type="button" className="nearestTreeButton nearestTreeButton--panel" onClick={locateNearestTree}>
                                    {nearestTreeState === 'loading' ? <Text tid="nearestTreeLoading" /> : <Text tid="nearestTreeAction" />}
                                </button>
                                <div className="nearestTreeFeedback nearestTreeFeedback--panel">
                                    {!guidedTreeId && nearestTreeFeedback}
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
            {!dm && !popupOpen && (
                <button
                    type="button"
                    className="nearestTreeButton nearestTreeButton--floating"
                    onClick={() => {
                        setIsNearestTreeFloatingDismissed(false);
                        locateNearestTree();
                    }}
                    aria-label={dictionary.nearestTreeAction || 'Find the nearest tree'}
                    title={dictionary.nearestTreeAction || 'Find the nearest tree'}
                >
                    <WalkingIcon />
                </button>
            )}
            {!dm && !hasUnlockedEveryTree && !guidedTreeId && nearestTreeFeedback && !isNearestTreeFloatingDismissed && (
                <div className="nearestTreeFeedback nearestTreeFeedback--floating">
                    <button
                        type="button"
                        className="nearestTreeFeedbackClose"
                        onClick={() => setIsNearestTreeFloatingDismissed(true)}
                        aria-label={dictionary.close || 'Fermer'}
                        title={dictionary.close || 'Fermer'}
                    >
                        ×
                    </button>
                    {nearestTreeFeedback}
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
