import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children, account, onConnect, isCorrectNetwork }) => {
  return (
    <div className="app-container">
      <Navbar 
        account={account} 
        onConnect={onConnect} 
        isCorrectNetwork={isCorrectNetwork}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout; 