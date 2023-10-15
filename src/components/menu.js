import React, { useContext, useCallback, useState, useEffect } from "react";
import trees from "../datas/datas.json";
import { PinContext, Text } from "../store";
import LanguageSelector from './languageSelector.js';


const listDate = Object.keys(trees);

const ListByYears = (props) => {
    const [setYearselected, yearselected, mapData] = props.actions;
    // const width = props.device;
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
                        mapData.goToArea([46.0507666, 14.5047565], 13);
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
    const { setDm, dm, setYearselected, setShowClouds, showClouds, markerRef, setModalContent, setTmppins, yearselected, mapData } = useContext(PinContext);

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


    return (
        <>
            <div className="pannel">
                <LanguageSelector />

                <h1 onClick={() => { setModalContent('about'); if (!dm) setDm(true) }}>
                    <Text tid="titre" />
                    <span className="about">?</span>
                </h1>
                <div className="content">
                    <ListByYears actions={[setYearselected, yearselected, mapData]} hover={setTmppins} markerRef={markerRef} />
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
