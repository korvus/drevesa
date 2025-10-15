import React, { useContext } from 'react';
import { PinContext, Text } from '../store';
import tshirt from '../img/tshirt.png';

const TshirtPromo = () => {
    const { dictionary } = useContext(PinContext);

    if (!dictionary || !dictionary.tshirtBanner) {
        return null;
    }

    return (
        <aside className="tshirtPromo" aria-label="Limited edition Ljubljana tree t-shirt">
            <a href="https://simon.gallery/shop/T/dinosaurs-are-outdated/">
                <div className="tshirtPromo__text">
                    <Text tid="tshirtBanner" />
                </div>
                <img src={tshirt} alt="Unique Ljubljana tree of the year t-shirt" />
            </a>
        </aside>
    );
};

export default TshirtPromo;
