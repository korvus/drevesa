
import {
    MapContainer,
    TileLayer,
    useMap,
    useMapEvent,
    Popup,
    Marker
} from "react-leaflet";
import Cloud from './cloud.js';
import "leaflet/dist/leaflet.css";
import Modalcontent from './modal.js';
import coords from '../datas/datas.json';
import sources from '../datas/roots.json';
import { PinContext, Text } from '../store';
import React, { useEffect, useRef, useContext, useState, useCallback } from "react";
import { TreeTwo, TreeThree, IconDefault, TreeOneInactive, TreeTwoInactive, TreeThreeInactive } from '../components/icon.js';

const Ljubljana = [46.0507666, 14.5047565];

const listDate = Object.keys(coords);

function constructJsx(trees, map, markerRef, userLanguage) {
    const jsxElements = [];
    let i = 0;
    let shouldBeOneAtLeast = 0;
    for (var tree in trees) {

        const title = trees[tree].popup[0];

        if (trees.hasOwnProperty(tree)) {
            let icone = IconDefault;
            if (trees[tree].icon === "tree2") icone = TreeTwo
            if (trees[tree].icon === "tree3") icone = TreeThree
            if (trees[tree].icon === "tree1inactive") icone = TreeOneInactive
            if (trees[tree].icon === "tree2inactive") icone = TreeTwoInactive
            if (trees[tree].icon === "tree3inactive") icone = TreeThreeInactive

            if (map.getBounds().contains(trees[tree].coords)) { shouldBeOneAtLeast++ };

            jsxElements.push(
                <Marker
                    key={i}
                    position={trees[tree].coords}
                    icon={icone}
                    ref={el => { markerRef.current[title] = el }}
                >
                    <Popup>
                        <span className="title">{title}</span>
                        <strong>
                            <span><Text tid="essence" /> : </span>
                            <Text classLink='externalLink' tid={trees[tree].name} />
                            <br />
                            <span><Text tid='address' /></span>
                            <a className="externalLink"
                                rel="noreferrer"
                                target="_blank"
                                href={trees[tree].adresse}>
                                <Text tid={`adrs${title}`} />
                            </a>
                            <br /><br />
                            {sources[userLanguage] &&
                                <a className="externalLink" target="blank" href={sources[userLanguage][title]}>
                                    <Text tid={`sources`} />
                                </a>
                            }
                        </strong>

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
    // loop on all years
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

    let trees = {};
    // On construit un objet artificiel avec les paramètres pour ensuite le passer aux markers (dans la fonction appelée ensuite constructJSX)
    // Si on survole
    if (props.hover !== 0) {
        trees = loopForOneMarker(trees, props.hover);
    } else {
        if (props.askedyear === 0) {
            trees = loopOnAllMarkers(trees);
        } else {
            trees = loopForOneMarker(trees, props.askedyear);
        }
    }

    // On liste les pins
    let arrTrees = constructJsx(trees, map, ref, userLanguage);

    useEffect(() => {
        if (arrTrees[1] === 0) {
            setWarn(true);
        } else {
            setWarn(false);
        }
    });

    useMapEvent('drag', () => {
        let arrTrees = constructJsx(trees, map, ref);
        if (arrTrees[1] === 0) {
            props.warning(true);
        } else {
            props.warning(false);
        }
    })

    useMapEvent('zoomend', () => {
        let arrTrees = constructJsx(trees, map, ref);
        if (arrTrees[1] === 0) {
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

    return null; // ce composant n'a pas besoin de rendre quoi que ce soit visuellement
}

const Map = () => {
    const { dm, mapData, divWidth, setDivWidth, yearselected, setWarning, tmppins, userLanguage, showClouds } = useContext(PinContext);

    const [divHeight, setDivHeight] = useState(0);
    const markerRef = useRef([]);
    const appRef = useRef(null);


    useEffect(() => {
        if (markerRef && markerRef.current) {
            if (yearselected === 0) {
                markerRef.current.forEach(
                    marker => {
                        marker.closePopup();
                    })
            }
            if (markerRef.current[yearselected]) {
                markerRef.current[yearselected].openPopup();
            }
        };
    }, [markerRef, yearselected]);


    const handleResize = useCallback(() => {
        setDivWidth(appRef.current.clientWidth);
        setDivHeight(appRef.current.clientHeight);
    }, [setDivWidth]);

    useEffect(() => {
        setDivWidth(appRef.current.clientWidth);
        setDivHeight(appRef.current.clientHeight);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize, setDivWidth]);

    return (
        <div className="App">
            {(divWidth > 0 && showClouds) && <Cloud widthContainer={divWidth} heightContainer={divHeight} />}
            <div className="mapContainer" ref={appRef}>

                {dm === true &&
                    <div className={"modal"}>
                        <Modalcontent />
                    </div>
                }
                <MapContainer center={Ljubljana} zoom={13} scrollWheelZoom={false} tap={false}>
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapInitializer setMapInstance={mapData.setMapObj} />

                    <ListMarkers hover={tmppins} warning={setWarning} askedyear={yearselected} markerRef={markerRef} userLanguage={userLanguage} />

                </MapContainer>
            </div>
        </div>
    );
};

export default Map;