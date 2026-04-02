import { lazy, Suspense, useContext } from "react";
import Modalcontent from './modal.js';
import { PinContext } from '../store';

const InteractiveMap = lazy(() => import('./interactiveMap.js'));

const IS_PRERENDER = typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap';

const Map = () => {
    const { dm, modalContent } = useContext(PinContext);

    if (IS_PRERENDER) {
        return (
            <div className="App">
                <div className="mapContainer mapPlaceholder">
                    {dm === true &&
                        <div className={`modal${modalContent === 'intro' ? ' modal--intro' : ''}${modalContent === 'about' ? ' modal--about' : ''}${modalContent === 'tooFar' ? ' modal--compact' : ''}${modalContent === 'treeUnlocked' ? ' modal--unlock' : ''}${modalContent === 'gameVictory' ? ' modal--victory' : ''}${modalContent === 'species' ? ' modal--species' : ''}`}>
                            <Modalcontent />
                        </div>
                    }
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="App"><div className="mapContainer mapPlaceholder" /></div>}>
            <InteractiveMap />
        </Suspense>
    );
};

export default Map;
