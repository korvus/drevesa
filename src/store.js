import React, { useState, createContext, useRef, useContext } from "react";
import { languageOptions, dictionaryList } from './datas/languages.js';
import ReactStringReplace from 'react-string-replace';

export const PinContext = createContext(null);

export function getCurrentLanguage() {
    let defaultLanguage = window.localStorage.getItem('ljb-lang');
    if (!defaultLanguage) {
        defaultLanguage = window.navigator.language.substring(0, 2);
    }
    return defaultLanguage;
}

export const PinContextProvider = props => {

    const mapRef = useRef();
    const [modalContent, setModalContent] = useState('');
    const [yearselected, setYearselected] = useState(0);
    const [dm, setDm] = useState(false);
    const [warning, setWarning] = useState(false);
    const [tmppins, setTmppins] = useState(0);
    const [showClouds, setShowClouds] = useState(false);
    const [userLanguage, setUserLanguage] = useState('fr');
    const [divWidth, setDivWidth] = useState(0);

    const [mapObj, setMapObj] = useState(null);
    const goToArea = (regionCoord, zoom = 13) => {
        if (mapObj) {
            mapObj.flyTo(regionCoord, zoom);
        }
    };

    const mapData = {
        mapObj: mapObj,
        setMapObj: setMapObj,
        goToArea: goToArea
    }

    const provider = {
        dm,
        setDm,
        mapRef,
        mapData,
        warning,
        goToArea,
        setWarning,
        userLanguage,
        tmppins, setTmppins,
        divWidth, setDivWidth,
        showClouds, setShowClouds,
        modalContent, setModalContent,
        yearselected, setYearselected,
        dictionary: dictionaryList[userLanguage],
        userLanguageChange: selected => {
            const newLanguage = languageOptions[selected] ? selected : 'fr'
            setUserLanguage(newLanguage);
            window.localStorage.setItem('ljb-lang', newLanguage);
        }
    };

    return (
        <PinContext.Provider value={provider}>
            {props.children}
        </PinContext.Provider>
    );
};

export function Text({ tid, classLink }) {
    const languageContext = useContext(PinContext);

    let str = languageContext.dictionary[tid] ? languageContext.dictionary[tid] : "";

    const matchGlobal = str.match(/\[a href='(.*?)'\](.*?)\[\/a\]|\[br\]/g);

    if (matchGlobal) {
        let replaced = str;
        matchGlobal.forEach((match) => {
            // console.log("matchGlobal", match);
            let regexLink = /\[a href='(.*?)'\](.*?)\[\/a\]/;
            let regexBr = /\[br\]/;
            if (regexLink.test(match)) {
                const [, link, text] = match.match(regexLink);
                replaced = ReactStringReplace(replaced, match, () => {
                    return <a className={classLink} href={link}>{text}</a>
                });
            };
            if (regexBr.test(match)) {
                replaced = ReactStringReplace(replaced, match, () => {
                    return <><br /></>
                });
            }
        });
        const result = React.Children.toArray(replaced);
        return <div>{result}</div>
    }
    return <>{str}</>;

};

export function FuncText(tid) {
    const lang = getCurrentLanguage();
    let str = dictionaryList[lang][tid] ? dictionaryList[lang][tid] : "";
    return str;
};




