import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ account, onConnect, isCorrectNetwork }) => {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img 
          src="/hexa-logo-transparent.png" 
          alt="Hexa Protocol Logo" 
          className="navbar-logo"
        />
        <span className="brand-text">HEXA PROTOCOL</span>
      </div>
      
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/my-tickets">My Tickets</Link>
        <Link to="/create-lottery">Create Lottery</Link>
        <Link to="/contract-manager">Contract Manager</Link>
      </div>

      <div className="wallet-section">
        {!account ? (
          <button className="connect-wallet-button" onClick={onConnect}>
            Connect Wallet
          </button>
        ) : !isCorrectNetwork ? (
          <button className="network-warning-button">
            Wrong Network
          </button>
        ) : (
          <span className="account-address">
            {formatAddress(account)}
          </span>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 