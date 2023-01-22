import React, { useContext } from 'react';
import sources from '../datas/roots.json';
import { PinContext, Text } from '../store';

function ListSources() {
    const listDate = Object.keys(sources);
    const { userLanguage } = useContext(PinContext);

    const sourcesByYear = [];
    for (const [, value] of listDate.entries()) {
        if (userLanguage === value) {
            // sources[value]
            Object.entries(sources[value]).map(([year, url]) => (
                sourcesByYear.push(<li key={year}><a rel="noreferrer" target="blank" href={url}>{year}</a></li>)
            ))
        }
    }
    // sourcesByYear.push(<li key={index}><a rel="noreferrer" target="blank" href={sources[value]}>{value}</a></li>);
    return sourcesByYear;
}

const Modalcontent = () => {
    const { setDm, modalContent } = useContext(PinContext);
    return (
        <div className="innerModal">
            <div title="Echap" onClick={() => setDm(false)} className="wrapperClose">
                <div className="close"></div>
            </div>
            <div className="contentModal">
                {modalContent === "about" &&
                    <>
                        <h2><Text tid="About" /></h2>
                        <div>
                            <Text tid="goalContent" />
                        </div>
                    </>
                }
                {modalContent === "sources" &&
                    <>
                        <h2><Text tid="sources" /></h2>
                        <ul>
                            <ListSources />
                        </ul>
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
            </div>
        </div>
    );
}

export default Modalcontent;