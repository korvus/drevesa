import React, { useContext, useMemo } from 'react';
import trees from '../datas/datas.json';
import { PinContext, Text } from '../store';
import carteExplication from '../img/carteExplication.png';
import herbierOuvert from '../img/herbierOuvert.png';
import herbierFerme from '../img/herbierFerme.png';
import speciesDetails from '../datas/speciesDetails.js';
import { getRandomTreeAnecdote } from '../datas/treeAnecdotes.js';
import reward2019 from '../img/rewards/reward2019.png';
import reward2020 from '../img/rewards/reward2020.png';
import reward2021 from '../img/rewards/reward2021.png';
import reward2022 from '../img/rewards/reward2022.png';
import reward2023 from '../img/rewards/reward2023.png';
import reward2024 from '../img/rewards/reward2024.png';

const LJUBLJANA_TREES_SOURCE_URL = 'https://www.ljubljana.si/sl/aktualno/novice/v-ljubljani-letos-izbiramo-drevored-leta';

const rewardImages = {
    2019: reward2019,
    2020: reward2020,
    2021: reward2021,
    2022: reward2022,
    2023: reward2023,
    2024: reward2024,
};

const Modalcontent = () => {
    const { setDm, modalContent, locateNearestTree, unlockEveryTree, resetUnlockedPassport, recentlyUnlockedTreeId, selectedSpeciesId, openSpeciesModal, dictionary, userLanguage } = useContext(PinContext);
    const unlockedTree = recentlyUnlockedTreeId && trees[recentlyUnlockedTreeId] ? trees[recentlyUnlockedTreeId][0] : null;
    const unlockedReward = recentlyUnlockedTreeId ? rewardImages[recentlyUnlockedTreeId] : null;
    const selectedSpecies = selectedSpeciesId ? speciesDetails[selectedSpeciesId] : null;
    const unlockedSpecies = unlockedTree ? speciesDetails[unlockedTree.name] : null;
    const randomTreeAnecdote = useMemo(() => {
        if (modalContent !== 'species' || !selectedSpeciesId) {
            return null;
        }

        return getRandomTreeAnecdote(userLanguage);
    }, [modalContent, selectedSpeciesId, userLanguage]);

    return (
        <div className="innerModal">
            <div title="Echap" onClick={() => setDm(false)} className="wrapperClose">
                <div className="close"></div>
            </div>
            <div className="contentModal">
                {modalContent === "about" &&
                    <>
                        <div className="aboutCopy">
                            <h2><Text tid="About" /></h2>
                            <div>
                                <Text tid="goalContent" />
                            </div>
                            <p className="aboutSourceLink">
                                <Text tid="aboutSourceLead" />{' '}
                                <a
                                    className="externalLink"
                                    rel="noreferrer"
                                    target="_blank"
                                    href={LJUBLJANA_TREES_SOURCE_URL}
                                    lang="sl"
                                    hrefLang="sl"
                                >
                                    <Text as="span" tid="aboutSourceLinkLabel" />
                                </a>{' '}
                                <Text tid="aboutSourceNote" />
                            </p>
                            <div className="gameActions">
                                <button type="button" className="gameActionButton" onClick={unlockEveryTree}>
                                    <Text tid="gameUnlockAll" />
                                </button>
                                <button type="button" className="gameActionButton gameActionButton--secondary" onClick={resetUnlockedPassport}>
                                    <Text tid="gameResetProgress" />
                                </button>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "contact" &&
                    <>
                        <h2><Text tid="contact" /></h2>
                        <div>
                            <Text tid="links" />
                        </div>
                    </>
                }
                {modalContent === "tooFar" &&
                    <>
                        <h2><Text tid="nearestTreeTooFarTitle" /></h2>
                        <div>
                            <Text tid="nearestTreeTooFar" />
                        </div>
                    </>
                }
                {modalContent === "intro" &&
                    <>
                        <div className="introCopy">
                            <h2><Text tid="introModalTitle" /></h2>
                            <div>
                                <Text tid="introModalContent" />
                            </div>
                            <div className="introGameLead">
                                <Text tid="introModalGameLead" />
                            </div>
                            <div className="introGameIllustration">
                                <img src={carteExplication} alt="" />
                            </div>
                            <div className="introGameWalk">
                                <Text tid="introModalWalkLead" />
                            </div>
                            <div className="gameActions">
                                <button type="button" className="gameActionButton" onClick={() => { setDm(false); locateNearestTree(); }}>
                                    <Text tid="introModalCta" />
                                </button>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "treeUnlocked" && unlockedTree &&
                    <>
                        <div className="unlockCopy">
                            {unlockedReward &&
                                <div className="unlockReward">
                                    <img src={unlockedReward} alt="" />
                                </div>
                            }
                            <header>
                                <h2><Text tid="gameUnlockedTitle" /></h2>
                                <div>
                                    <Text tid="gameUnlockedLead" /> <strong>{recentlyUnlockedTreeId}</strong>.
                                </div>
                            </header>
                            <div className="unlockMeta">
                                <p>
                                    <strong><Text tid="gameUnlockedYearLabel" /></strong> {recentlyUnlockedTreeId}
                                </p>
                                <p>
                                    <strong><Text tid="essence" /> : </strong>
                                    {unlockedSpecies ? (
                                        <button
                                            type="button"
                                            className="speciesTrigger"
                                            onClick={() => openSpeciesModal(unlockedTree.name)}
                                            title={dictionary.speciesModalTriggerHint}
                                            aria-label={dictionary.speciesModalTriggerHint}
                                        >
                                            <img className="speciesTriggerIcon" src={herbierFerme} alt="" aria-hidden="true" />
                                            <Text as="span" tid={unlockedSpecies.nameTid} />
                                        </button>
                                    ) : (
                                        <Text as="span" tid={unlockedTree.name} />
                                    )}
                                </p>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "gameVictory" && unlockedTree &&
                    <>
                        <div className="victoryCopy">
                            {unlockedReward &&
                                <div className="unlockReward unlockReward--victory">
                                    <img src={unlockedReward} alt="" />
                                </div>
                            }
                            <header>
                                <p className="victoryEyebrow"><Text tid="gameVictoryEyebrow" /></p>
                                <h2><Text tid="gameVictoryTitle" /></h2>
                                <div>
                                    <Text tid="gameVictoryLead" />
                                </div>
                            </header>
                            <div className="unlockMeta">
                                <p>
                                    <strong><Text tid="gameUnlockedYearLabel" /></strong> {recentlyUnlockedTreeId}
                                </p>
                                <p>
                                    <strong><Text tid="gameVictoryLastTreeLabel" /></strong> {recentlyUnlockedTreeId}
                                </p>
                                <p>
                                    <Text tid="gameVictoryBody" />
                                </p>
                            </div>
                        </div>
                    </>
                }
                {modalContent === "species" && selectedSpecies &&
                    <>
                        <div className="speciesCopy">
                            <div className="speciesIllustration">
                                <img src={herbierOuvert} alt="" />
                            </div>
                            <h2><Text tid={selectedSpecies.nameTid} /></h2>
                            <div className="speciesBody">
                                <Text tid={selectedSpecies.anecdoteTid} />
                            </div>
                            {selectedSpecies.facts && selectedSpecies.facts.length > 0 && (
                                <section className="speciesFactsCard">
                                    <h3><Text tid="speciesFactsTitle" /></h3>
                                    <dl className="speciesFactsList">
                                        {selectedSpecies.facts.map((fact) => (
                                            <div key={fact.labelTid} className="speciesFactsItem">
                                                <dt><Text tid={fact.labelTid} /></dt>
                                                <dd>{fact.value[userLanguage] || fact.value.fr}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </section>
                            )}
                            {randomTreeAnecdote && (
                                <aside className="speciesAnecdoteCard">
                                    <h3><Text tid="speciesTriviaTitle" /></h3>
                                    <p>{randomTreeAnecdote.text}</p>
                                    <a
                                        className="externalLink speciesAnecdoteSource"
                                        rel="noreferrer"
                                        target="_blank"
                                        href={randomTreeAnecdote.sourceUrl}
                                    >
                                        <Text as="span" tid="speciesTriviaSource" />
                                    </a>
                                </aside>
                            )}
                            <div className="speciesLinks">
                                <h3><Text tid="speciesModalLinksTitle" /></h3>
                                <ul>
                                    {selectedSpecies.links.map((link) => (
                                        <li key={link.url}>
                                            <a className="externalLink" rel="noreferrer" target="_blank" href={link.url}>
                                                <Text as="span" tid={link.labelTid} />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                }
            </div>
        </div>
    );
}

export default Modalcontent;
