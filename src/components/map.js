import { lazy, Suspense, useContext } from "react";
import coords from '../datas/datas.json';
import speciesDetails from '../datas/speciesDetails.js';
import { PinContext, Text } from '../store';

const InteractiveMap = lazy(() => import('./interactiveMap.js'));

const IS_PRERENDER = typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap';
const listDate = Object.keys(coords);

const STATIC_COPY = {
    fr: {
        eyebrow: 'Version statique sans JavaScript',
        intro: 'Cette version HTML resume la carte interactive pour les moteurs de recherche et les navigateurs sans JavaScript.',
        gameTitle: 'Mode exploration sur place',
        gameBody: 'Dans l application interactive, chaque arbre non decouvert propose un bouton Y aller. Il lance le suivi GPS, trace un itineraire a pied vers l arbre choisi, garde la position du visiteur a jour et peut recalculer le chemin sans multiplier les requetes.',
        trackingBody: 'Lorsque le visiteur deplace la carte pendant le trajet, le suivi visuel est mis en pause et un bouton de recentrage permet de revenir a sa position. Le passeport de l arbre se debloque automatiquement lorsque le visiteur arrive a moins de 20 m.',
        treeListTitle: 'Arbres et allees repertories',
        addressLabel: 'Adresse',
        coordsLabel: 'Coordonnees',
        speciesLabel: 'Essence',
        openMapLabel: 'Ouvrir la position',
        sourceTitle: 'Source officielle',
        sourceBody: 'La selection est issue des arbres et allees de l annee choisis a Ljubljana depuis 2019.'
    },
    en: {
        eyebrow: 'Static version without JavaScript',
        intro: 'This HTML version summarises the interactive map for search engines and browsers without JavaScript.',
        gameTitle: 'On-site exploration mode',
        gameBody: 'In the interactive app, each undiscovered tree offers a Go there button. It starts GPS tracking, draws a walking route to the selected tree, keeps the visitor position up to date, and can recalculate the route without sending excessive requests.',
        trackingBody: 'When the visitor moves the map during the walk, visual following is paused and a recenter button brings the map back to the current position. The tree passport unlocks automatically when the visitor arrives within 20 m.',
        treeListTitle: 'Listed trees and avenues',
        addressLabel: 'Address',
        coordsLabel: 'Coordinates',
        speciesLabel: 'Species',
        openMapLabel: 'Open location',
        sourceTitle: 'Official source',
        sourceBody: 'The selection is based on the Tree and Avenue of the Year choices in Ljubljana since 2019.'
    },
    sl: {
        eyebrow: 'Staticna razlicica brez JavaScripta',
        intro: 'Ta HTML razlicica povzema interaktivni zemljevid za iskalnike in brskalnike brez JavaScripta.',
        gameTitle: 'Raziskovanje na lokaciji',
        gameBody: 'V interaktivni aplikaciji ima vsako se neodkrito drevo gumb Pojdi tja. Ta zazene GPS sledenje, narise pespot do izbranega drevesa, posodablja polozaj obiskovalca in lahko znova izracuna pot brez pretiranega stevila zahtev.',
        trackingBody: 'Ko obiskovalec med hojo premakne zemljevid, se vizualno sledenje zacasno ustavi, gumb za ponovno centriranje pa zemljevid vrne na trenutni polozaj. Potni list drevesa se samodejno odklene, ko je obiskovalec manj kot 20 m od drevesa.',
        treeListTitle: 'Zbrana drevesa in drevoredi',
        addressLabel: 'Naslov',
        coordsLabel: 'Koordinate',
        speciesLabel: 'Vrsta',
        openMapLabel: 'Odpri lokacijo',
        sourceTitle: 'Uradni vir',
        sourceBody: 'Izbor temelji na ljubljanskih drevesih in drevoredih leta od 2019.'
    }
};

const LJUBLJANA_TREES_SOURCE_URL = 'https://www.ljubljana.si/sl/aktualno/novice/v-ljubljani-letos-izbiramo-drevored-leta';

function StaticPrerenderContent() {
    const { dictionary, userLanguage } = useContext(PinContext);
    const copy = STATIC_COPY[userLanguage] || STATIC_COPY.fr;

    return (
        <div className="staticMapFallback">
            <section className="staticHero" aria-labelledby="static-title">
                <p className="staticEyebrow">{copy.eyebrow}</p>
                <h2 id="static-title"><Text tid="titre" /></h2>
                <p>{dictionary.seoDescription}</p>
                <p>{copy.intro}</p>
                <img src="/preview.png" alt={dictionary.seoImageAlt || ''} />
            </section>

            <section className="staticGameSummary" aria-labelledby="static-game-title">
                <h3 id="static-game-title">{copy.gameTitle}</h3>
                <p>{copy.gameBody}</p>
                <p>{copy.trackingBody}</p>
            </section>

            <section className="staticTreeList" aria-labelledby="static-tree-list-title">
                <h3 id="static-tree-list-title">{copy.treeListTitle}</h3>
                <ol>
                    {listDate.map((year) => {
                        const tree = coords[year][0];
                        const species = speciesDetails[tree.name];
                        const [lat, lng] = tree.coords;

                        return (
                            <li key={year}>
                                <article className="staticTreeCard">
                                    <h4>{year}</h4>
                                    <p>
                                        <strong>{copy.speciesLabel} : </strong>
                                        <Text as="span" tid={species?.nameTid || tree.name} />
                                    </p>
                                    <p>
                                        <strong>{copy.addressLabel} : </strong>
                                        <Text as="span" tid={`adrs${year}`} />
                                    </p>
                                    <p>
                                        <strong>{copy.coordsLabel} : </strong>
                                        <span>{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                                    </p>
                                    <a rel="noreferrer" href={tree.adresse}>
                                        {copy.openMapLabel}
                                    </a>
                                </article>
                            </li>
                        );
                    })}
                </ol>
            </section>

            <section className="staticSource" aria-labelledby="static-source-title">
                <h3 id="static-source-title">{copy.sourceTitle}</h3>
                <p>{copy.sourceBody}</p>
                <a rel="noreferrer" href={LJUBLJANA_TREES_SOURCE_URL}>
                    <Text as="span" tid="aboutSourceLinkLabel" />
                </a>
            </section>
        </div>
    );
}

const Map = () => {
    if (IS_PRERENDER) {
        return (
            <div className="App">
                <div className="mapContainer mapPlaceholder">
                    <StaticPrerenderContent />
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
