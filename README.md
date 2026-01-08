# Drevesa · Ljubljana Trees of the Year

## English

### What is this?
An open-source React Leaflet map that highlights the trees (and more recently, avenues) selected by Ljubljana residents each year since 2019.

### Tech stack
- React + Vite for the single-page app
- React-Leaflet + OpenStreetMap tiles for mapping
- Local JSON datasets (`src/datas/*.json`) for tree metadata, translations, and data sources

### Getting started
- Install dependencies: `npm install`
- Run the dev server: `npm run dev`
- Build for production: `npm run build`

The map expects the data files to remain valid JSON. Run the app locally after edits to verify marker placement and translations.

### Updating data
1. Add the new marker icons (active + inactive) to `src/img/`.
2. Register them in `src/components/icon.js`.
3. Append the yearly entry inside `src/datas/datas.json` (coordinates, icon keys, map link).
4. Update translations (`src/datas/en.json`, `fr.json`, `sl.json`) and cite the source in `src/datas/roots.json`.

### Credits
Built by [Simon Ertel](https://simonertel.net). Map tiles © OpenStreetMap contributors.

---

## Français

### Présentation
Application React Leaflet qui recense les arbres (et désormais avenues) élus chaque année par les habitants de Ljubljana depuis 2019.

### Pile technique
- React + Vite pour l'application
- React-Leaflet + tuiles OpenStreetMap pour la carte
- Jeux de données JSON locaux (`src/datas/*.json`) pour les informations, traductions et sources

### Démarrage
- Installer les dépendances : `npm install`
- Lancer le serveur de développement : `npm run dev`
- Construire la version de production : `npm run build`

Veillez à conserver des JSON valides. Testez l'appli en local après chaque mise à jour afin de vérifier la position des marqueurs et les traductions.

### Mise à jour des données
1. Ajouter les nouvelles icônes (actives + inactives) dans `src/img/`.
2. Les enregistrer dans `src/components/icon.js`.
3. Compléter l'entrée annuelle dans `src/datas/datas.json` (coordonnées, icônes, lien Google Maps).
4. Mettre à jour les traductions (`src/datas/en.json`, `fr.json`, `sl.json`) et référencer la source dans `src/datas/roots.json`.

### Crédits
Créé par Simon Ertel. Tuiles cartographiques © contributeurs OpenStreetMap.

---

## Slovensko

### Kaj je to?
Odprtokodna React Leaflet aplikacija, ki prikazuje drevesa (in zadnje čase tudi drevorede), za katera Ljubljančani glasujejo od leta 2019 dalje.

### Tehnologija
- React + Vite za enostransko aplikacijo
- React-Leaflet + OpenStreetMap ploščice za karto
- Lokalni JSON podatki (`src/datas/*.json`) za metapodatke, prevode in vire

### Začetek
- Namestite odvisnosti: `npm install`
- Zaženite razvojni strežnik: `npm run dev`
- Pripravite produkcijsko različico: `npm run build`

Po vsaki spremembi podatkov preverite, da JSON ostane veljaven in da se aplikacija pravilno naloži z novimi oznakami.

### Posodabljanje podatkov
1. Dodajte nove ikone (aktivne + neaktivne) v `src/img/`.
2. Prijavite jih v `src/components/icon.js`.
3. Dodajte letni zapis v `src/datas/datas.json` (koordinate, ikone, povezava).
4. Osvežite prevode (`src/datas/en.json`, `fr.json`, `sl.json`) ter vir v `src/datas/roots.json`.

### Zahvale
Avtor [Simon Ertel](https://simonertel.net). Kartografski podatki © sodelavci OpenStreetMap.
