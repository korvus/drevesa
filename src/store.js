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

    const provider = {
        dm,
        setDm,
        mapRef,
        mapData,
        warning,
        goToArea,
        setWarning,
        userLanguage: activeLanguage,
        userPosition, setUserPosition,
        routeToTree, setRouteToTree,
        routeMeta, setRouteMeta,
        tmppins, setTmppins,
        divWidth, setDivWidth,
        showClouds, setShowClouds,
        modalContent, setModalContent,
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




