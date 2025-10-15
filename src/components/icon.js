import treeDefault from "../img/tree1.png";
import treeTwo from "../img/tree2.png";
import treeThree from "../img/tree3.png";
import treeFour from "../img/tree4.png";
import treeFive from "../img/tree5.png";
import treeOneInactive from "../img/tree1inactive.png";
import treeTwoInactive from "../img/tree2inactive.png";
import treeThreeInactive from "../img/tree3inactive.png";
import treeFourInactive from "../img/tree4inactive.png";
import treeFiveInactive from "../img/tree5inactive.png";

import L from "leaflet";

const popupAnchor = [-13, -41];
const className = "awesome-marker-icon-transparent";

const iconDefinitions = {
  tree1: { src: treeDefault, size: [42, 52], anchor: [33, 41] },
  tree1inactive: { src: treeOneInactive, size: [42, 52], anchor: [33, 41] },
  tree2: { src: treeTwo, size: [42, 43], anchor: [34, 41] },
  tree2inactive: { src: treeTwoInactive, size: [42, 43], anchor: [34, 41] },
  tree3: { src: treeThree, size: [42, 52], anchor: [33, 41] },
  tree3inactive: { src: treeThreeInactive, size: [42, 52], anchor: [33, 41] },
  tree4: { src: treeFour, size: [42, 52], anchor: [33, 41] },
  tree4inactive: { src: treeFourInactive, size: [42, 52], anchor: [33, 41] },
  tree5: { src: treeFive, size: [42, 52], anchor: [33, 41] },
  tree5inactive: { src: treeFiveInactive, size: [42, 52], anchor: [33, 41] },
};

const icons = Object.keys(iconDefinitions).reduce((acc, key) => {
  const { src, size, anchor } = iconDefinitions[key];
  acc[key] = new L.Icon({
    iconUrl: src,
    iconRetinaUrl: src,
    popupAnchor,
    iconSize: new L.Point(size[0], size[1]),
    iconAnchor: anchor,
    className,
  });
  return acc;
}, {});

export const IconDefault = icons.tree1;
export const TreeTwo = icons.tree2;
export const TreeThree = icons.tree3;
export const TreeFour = icons.tree4;
export const TreeFive = icons.tree5;
export const TreeOneInactive = icons.tree1inactive;
export const TreeTwoInactive = icons.tree2inactive;
export const TreeThreeInactive = icons.tree3inactive;
export const TreeFourInactive = icons.tree4inactive;
export const TreeFiveInactive = icons.tree5inactive;

export const getIcon = iconName => icons[iconName] || IconDefault;

export default icons;
