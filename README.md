# Drevesa Â· Ljubljana Trees of the Year

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
Built by [Simon Ertel](https://simonertel.net). Map tiles Â© OpenStreetMap contributors.

---

## FranÃ§ais

### PrÃ©sentation
Application React Leaflet qui recense les arbres (et dÃ©sormais avenues) Ã©lus chaque annÃ©e par les habitants de Ljubljana depuis 2019.

### Pile technique
- React + Vite pour l'application
- React-Leaflet + tuiles OpenStreetMap pour la carte
- Jeux de donnÃ©es JSON locaux (`src/datas/*.json`) pour les informations, traductions et sources

### DÃ©marrage
- Installer les dÃ©pendances : `npm install`
- Lancer le serveur de dÃ©veloppement : `npm run dev`
- Construire la version de production : `npm run build`

Veillez Ã  conserver des JSON valides. Testez l'appli en local aprÃ¨s chaque mise Ã  jour afin de vÃ©rifier la position des marqueurs et les traductions.

### Mise Ã  jour des donnÃ©es
1. Ajouter les nouvelles icÃ´nes (actives + inactives) dans `src/img/`.
2. Les enregistrer dans `src/components/icon.js`.
3. ComplÃ©ter l'entrÃ©e annuelle dans `src/datas/datas.json` (coordonnÃ©es, icÃ´nes, lien Google Maps).
4. Mettre Ã  jour les traductions (`src/datas/en.json`, `fr.json`, `sl.json`) et rÃ©fÃ©rencer la source dans `src/datas/roots.json`.

### CrÃ©dits
CrÃ©Ã© par Simon Ertel. Tuiles cartographiques Â© contributeurs OpenStreetMap.

---

## Slovensko

### Kaj je to?
Odprtokodna React Leaflet aplikacija, ki prikazuje drevesa (in zadnje Äase tudi drevorede), za katera LjubljanÄani glasujejo od leta 2019 dalje.

### Tehnologija
- React + Vite za enostransko aplikacijo
- React-Leaflet + OpenStreetMap ploÅ¡Äice za karto
- Lokalni JSON podatki (`src/datas/*.json`) za metapodatke, prevode in vire

### ZaÄetek
- Namestite odvisnosti: `npm install`
- ZaÅ¾enite razvojni streÅ¾nik: `npm run dev`
- Pripravite produkcijsko razliÄico: `npm run build`

Po vsaki spremembi podatkov preverite, da JSON ostane veljaven in da se aplikacija pravilno naloÅ¾i z novimi oznakami.

### Posodabljanje podatkov
1. Dodajte nove ikone (aktivne + neaktivne) v `src/img/`.
2. Prijavite jih v `src/components/icon.js`.
3. Dodajte letni zapis v `src/datas/datas.json` (koordinate, ikone, povezava).
4. OsveÅ¾ite prevode (`src/datas/en.json`, `fr.json`, `sl.json`) ter vir v `src/datas/roots.json`.

### Zahvale
Avtor [Simon Ertel](https://simonertel.net). Kartografski podatki Â© sodelavci OpenStreetMap.
