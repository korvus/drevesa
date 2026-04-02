import './style/App.css';
import './style/leaflet.css';
import Col from './components/menu.js';
import Map from './components/map.js';
import TshirtPromo from './components/promo.js';
import Seo from './components/seo.js';
import { PinContext, PinContextProvider } from './store';
import { useContext, useEffect, useMemo, useState } from 'react';

function CelebrationOverlay() {
  const { celebrationKey } = useContext(PinContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (celebrationKey === 0) {
      return undefined;
    }

    setIsVisible(true);
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [celebrationKey]);

  const confettiPieces = useMemo(
    () => Array.from({ length: 42 }, (_, index) => index),
    []
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div key={celebrationKey} className="celebrationOverlay" aria-hidden="true">
      {confettiPieces.map((piece) => (
        <span
          key={piece}
          className="celebrationOverlay__piece"
          style={{
            left: `${(piece % 8) * 12 + 4}%`,
            animationDelay: `${(piece % 6) * 0.08}s`,
            animationDuration: `${1.8 + (piece % 5) * 0.18}s`
          }}
        />
      ))}
    </div>
  );
}

function App() {
  return (
    <PinContextProvider>
      <Seo />
      <CelebrationOverlay />
      <Col />
      <Map />
      <TshirtPromo />
    </PinContextProvider>
  );
}

export default App;

