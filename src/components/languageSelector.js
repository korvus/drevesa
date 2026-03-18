import React, { useContext } from 'react';

import { languageOptions } from '../datas/languages';
import { PinContext } from '../store.js';

export default function LanguageSelector() {
  const { userLanguage, userLanguageChange } = useContext(PinContext);

  return (
    <div className='langues'>
      {Object.entries(languageOptions).map(([id, name]) => (
        <button
          type="button"
          className={`${userLanguage === id ? "active" : ""}`}
          onClick={() => userLanguageChange(id)}
          key={id}
        >
          {name}
        </button>
      ))}
    </div>
  );
};
