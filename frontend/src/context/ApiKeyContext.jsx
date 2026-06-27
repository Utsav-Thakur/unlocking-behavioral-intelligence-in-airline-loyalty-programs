import React, { createContext, useState } from 'react';

export const ApiKeyContext = createContext({
  apiKey: '',
  setApiKey: () => {},
  provider: 'claude',
  setProvider: () => {}
});

export const ApiKeyProvider = ({ children }) => {
  const [apiKey, setApiKeyState] = useState(() => {
    return localStorage.getItem('loyaltyiq_api_key') || '';
  });

  const [provider, setProviderState] = useState(() => {
    return localStorage.getItem('loyaltyiq_api_provider') || 'claude';
  });

  const setApiKey = (key) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem('loyaltyiq_api_key', key);
    } else {
      localStorage.removeItem('loyaltyiq_api_key');
    }
  };

  const setProvider = (prov) => {
    setProviderState(prov);
    localStorage.setItem('loyaltyiq_api_provider', prov);
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, provider, setProvider }}>
      {children}
    </ApiKeyContext.Provider>
  );
};
