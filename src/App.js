import './style/App.css';
import './style/leaflet.css';
import Col from './components/menu.js';
import Map from './components/map.js';
import TshirtPromo from './components/promo.js';
import Seo from './components/seo.js';
import { PinContextProvider } from './store';

function App() {
  return (
    <PinContextProvider>
      <Seo />
      <Col />
      <Map />
      <TshirtPromo />
    </PinContextProvider>
  );
}

export default App;

