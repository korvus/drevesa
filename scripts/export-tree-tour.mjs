import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const dataPath = path.join(projectRoot, 'src', 'datas', 'datas.json');
const outputDir = path.join(projectRoot, 'root', 'exports');

const rawData = fs.readFileSync(dataPath, 'utf8');
const yearlyTrees = JSON.parse(rawData);

const englishSpeciesLabels = {
  sycamore: 'London plane',
  weeping_beech: 'Weeping beech',
  Caucasian_wingnut: 'Caucasian wingnut',
  Persian_ironwood: 'Persian ironwood',
  Japanese_cherries: 'Japanese cherries',
  ginkgo: 'Ginkgo biloba'
};

const addressLabels = {
  '2019': 'Strossmayerjeva / Streliska corner',
  '2020': '93 Vodnikova road',
  '2021': 'Linhartova / Knobleharjeva / Fabianijeva intersection',
  '2022': '6 Slajmerjeva street',
  '2023': 'Aljazeva street',
  '2024': 'Valvasor Park'
};

function distanceBetween(a, b) {
  const latFactor = 111.32;
  const averageLatitude = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const lngFactor = 111.32 * Math.cos(averageLatitude);
  const dLat = (a.lat - b.lat) * latFactor;
  const dLng = (a.lng - b.lng) * lngFactor;
  return Math.sqrt((dLat ** 2) + (dLng ** 2));
}

function normaliseTrees(entries) {
  return Object.entries(entries).map(([year, items]) => {
    const tree = items[0];
    return {
      year,
      speciesKey: tree.name,
      species: englishSpeciesLabels[tree.name] || tree.name,
      address: addressLabels[year] || '',
      mapUrl: tree.adresse,
      lat: tree.coords[0],
      lng: tree.coords[1]
    };
  });
}

function buildNearestNeighborTour(points) {
  const remaining = [...points].sort((a, b) => a.lng - b.lng);
  const ordered = [remaining.shift()];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const candidateDistance = distanceBetween(current, candidate);
      if (candidateDistance < bestDistance) {
        bestDistance = candidateDistance;
        bestIndex = index;
      }
    });

    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }

  return ordered;
}

function buildGoogleMapsUrl(tour) {
  const origin = `${tour[0].lat},${tour[0].lng}`;
  const destination = `${tour[tour.length - 1].lat},${tour[tour.length - 1].lng}`;
  const waypoints = tour
    .slice(1, -1)
    .map((point) => `${point.lat},${point.lng}`)
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}`;
}

function buildKml(tour) {
  const placemarks = tour.map((point) => `    <Placemark>
      <name>${point.year} - ${point.species}</name>
      <description>${point.address}</description>
      <Point>
        <coordinates>${point.lng},${point.lat},0</coordinates>
      </Point>
    </Placemark>`).join('\n');

  const lineCoordinates = tour.map((point) => `${point.lng},${point.lat},0`).join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Ljubljana Tree Tour</name>
    <description>Walking tour built from the geolocated Tree of the Year dataset.</description>
    <Style id="tourLine">
      <LineStyle>
        <color>ff2f7ed8</color>
        <width>4</width>
      </LineStyle>
    </Style>
${placemarks}
    <Placemark>
      <name>Suggested walking order</name>
      <styleUrl>#tourLine</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${lineCoordinates}</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
`;
}

function buildGeoJson(tour) {
  return {
    type: 'FeatureCollection',
    features: [
      ...tour.map((point, index) => ({
        type: 'Feature',
        properties: {
          order: index + 1,
          year: point.year,
          species: point.species,
          address: point.address,
          mapUrl: point.mapUrl
        },
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        }
      })),
      {
        type: 'Feature',
        properties: {
          name: 'Suggested walking order'
        },
        geometry: {
          type: 'LineString',
          coordinates: tour.map((point) => [point.lng, point.lat])
        }
      }
    ]
  };
}

function buildCsv(tour) {
  const header = 'order,year,species,address,latitude,longitude,google_maps_pin_url';
  const rows = tour.map((point, index) => {
    const values = [
      index + 1,
      point.year,
      `"${point.species}"`,
      `"${point.address}"`,
      point.lat,
      point.lng,
      `"https://www.google.com/maps?q=${point.lat},${point.lng}"`
    ];
    return values.join(',');
  });

  return [header, ...rows].join('\n');
}

function buildSummary(tour, googleMapsUrl) {
  const orderedYears = tour.map((point) => point.year).join(' -> ');
  return [
    'Ljubljana Tree Tour export',
    '',
    `Suggested order: ${orderedYears}`,
    `Google Maps walking directions: ${googleMapsUrl}`,
    '',
    'Import into Google My Maps:',
    '1. Open https://www.google.com/mymaps',
    '2. Create a new map',
    '3. Import the file tree-tour.kml or tree-tour.geojson',
    '',
    'Files generated in this folder:',
    '- tree-tour.kml',
    '- tree-tour.geojson',
    '- tree-tour.csv',
    '- google-maps-tour-url.txt'
  ].join('\n');
}

const normalisedTrees = normaliseTrees(yearlyTrees);
const tour = buildNearestNeighborTour(normalisedTrees);
const googleMapsUrl = buildGoogleMapsUrl(tour);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'tree-tour.kml'), buildKml(tour), 'utf8');
fs.writeFileSync(path.join(outputDir, 'tree-tour.geojson'), `${JSON.stringify(buildGeoJson(tour), null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'tree-tour.csv'), `${buildCsv(tour)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'google-maps-tour-url.txt'), `${googleMapsUrl}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'README.txt'), `${buildSummary(tour, googleMapsUrl)}\n`, 'utf8');

console.log(`Exported ${tour.length} tree stops to ${outputDir}`);
console.log(`Suggested order: ${tour.map((point) => point.year).join(' -> ')}`);
console.log(`Google Maps URL: ${googleMapsUrl}`);
