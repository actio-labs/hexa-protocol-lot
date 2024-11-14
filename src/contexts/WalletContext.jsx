import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkNetwork, connectWallet } from '../services/web3';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // ... wallet logic

  return (
    <WalletContext.Provider value={{ account, isCorrectNetwork, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}; 