import treeDefault from "../img/tree1.png";
import treeTwo from "../img/tree2.png";
import treeThree from "../img/tree3.png";
import treeOneInactive from '../img/tree1inactive.png';
import treeTwoInactive from '../img/tree2inactive.png';
import treeThreeInactive from '../img/tree3inactive.png';

import L from 'leaflet';

export const TreeTwo = new L.Icon({
    iconUrl: treeTwo,
    iconRetinaUrl: treeTwo,
    popupAnchor: [-13, -41],
    iconSize: new L.Point(42, 43),
    iconAnchor: [34, 41],
    className: 'awesome-marker-icon-transparent'
});

export const TreeTwoInactive = new L.Icon({
    iconUrl: treeTwoInactive,
    iconRetinaUrl: treeTwoInactive,
    popupAnchor: [-13, -41],
    iconSize: new L.Point(42, 43),
    iconAnchor: [34, 41],
    className: 'awesome-marker-icon-transparent'
});

export const TreeThree = new L.Icon({
    iconUrl: treeThree,
    iconRetinaUrl: treeThree,
    popupAnchor: [-13, -41],
    iconSize: new L.Point(42, 52),
    iconAnchor: [33, 41],
    className: 'awesome-marker-icon-transparent'
});

export const TreeThreeInactive = new L.Icon({
    iconUrl: treeThreeInactive,
    iconRetinaUrl: treeThreeInactive,
    popupAnchor: [-13, -41],
    iconSize: new L.Point(42, 52),
    iconAnchor: [33, 41],
    className: 'awesome-marker-icon-transparent'
});


export const IconDefault = new L.Icon({
    iconUrl: treeDefault,
    iconRetinaUrl: treeDefault,
    popupAnchor: [-13, -41],
    iconSize: new L.Point(42, 52),
    iconAnchor: [33, 41],
    className: 'awesome-marker-icon-transparent'
});

export const TreeOneInactive = new L.Icon({
    iconUrl: treeOneInactive,
    iconRetinaUrl: treeOneInactive,
    popupAnchor: [-13, -41],
    iconSize: new L.Point(42, 52),
    iconAnchor: [33, 41],
    className: 'awesome-marker-icon-transparent'
});
