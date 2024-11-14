import React from 'react';
import Navbar from './Navbar';
import Background from './Background';

const Layout = ({ children, account, onConnect, isCorrectNetwork }) => {
  return (
    <>
      <Background />
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
    </>
  );
};

export default Layout; 