import './style/App.css';
import './style/leaflet.css';
import Col from './components/menu.js';
import Map from './components/map.js';
import { PinContextProvider } from './store';

function App() {
  return (
    <PinContextProvider>
      <Col />
      <Map />
    </PinContextProvider>
  );
}

export default App;
