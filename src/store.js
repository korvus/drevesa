import React, { useState, createContext, useRef, useContext, useEffect } from "react";
import { languageOptions, dictionaryList } from './datas/languages.js';
import ReactStringReplace from 'react-string-replace';

export const PinContext = createContext(null);

const LANGUAGE_FALLBACK = 'fr';
const LANGUAGE_ALIASES = {
    si: 'sl'
};

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

    const storedLanguage = normalizeLanguage(window.localStorage.getItem('ljb-lang'));
    if (storedLanguage) {
        return storedLanguage;
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

    useEffect(() => {
        const currentPath = window.location.pathname;
        const currentLanguagePath = getLanguagePath(userLanguage);
        const normalizedPath = currentPath === '/si' || currentPath === '/si/' ? '/sl' : currentPath;

        if (normalizedPath !== currentLanguagePath && normalizedPath !== `${currentLanguagePath}/`) {
            window.history.replaceState({}, '', currentLanguagePath);
        } else if (currentPath !== normalizedPath) {
            window.history.replaceState({}, '', normalizedPath);
        }

        window.localStorage.setItem('ljb-lang', userLanguage);
    }, [userLanguage]);

    useEffect(() => {
        const handlePopState = () => {
            setUserLanguage(getCurrentLanguage());
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const provider = {
        dm,
        setDm,
        mapRef,
        mapData,
        warning,
        goToArea,
        setWarning,
        userLanguage,
        userPosition, setUserPosition,
        routeToTree, setRouteToTree,
        routeMeta, setRouteMeta,
        tmppins, setTmppins,
        divWidth, setDivWidth,
        showClouds, setShowClouds,
        modalContent, setModalContent,
        yearselected, setYearselected,
        dictionary: dictionaryList[userLanguage],
        userLanguageChange: selected => {
            const newLanguage = normalizeLanguage(selected) || LANGUAGE_FALLBACK;
            setUserLanguage(newLanguage);
            window.localStorage.setItem('ljb-lang', newLanguage);
            window.history.pushState({}, '', getLanguagePath(newLanguage));
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
                    return <a target="blank" className={classLink} href={link}>{text}</a>
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




