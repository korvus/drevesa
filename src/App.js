import './style/App.css';
import './style/leaflet.css';
import Col from './components/menu.js';
import Map from './components/map.js';
import TshirtPromo from './components/promo.js';\nimport Seo from './components/seo.js';
import { PinContextProvider } from './store';

function App() {
  return (
    <PinContextProvider>\n      <Seo />\n      <Col />
      <Map />
      <TshirtPromo />
    </PinContextProvider>
  );
}

export default App;

