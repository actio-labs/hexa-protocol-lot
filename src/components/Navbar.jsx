import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ account, onConnect, isCorrectNetwork }) => {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <img 
          src="/hexa-protocol-lot/hexa-logo-transparent.png" 
          alt="Hexa Protocol Logo" 
          className="navbar-logo"
        />
        <span className="brand-text">HEXA PROTOCOL</span>
      </div>
      
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/my-tickets" className="nav-link">My Tickets</Link>
        <Link to="/create-lottery" className="nav-link">Create Lottery</Link>
        <Link to="/contract-manager" className="nav-link">Contract Manager</Link>
      </div>

      <div className="wallet-section">
        {!account ? (
          <button className="connect-wallet-btn" onClick={onConnect}>
            Connect Wallet
          </button>
        ) : !isCorrectNetwork ? (
          <button className="network-warning-btn">
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