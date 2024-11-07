import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ account, onConnect, isCorrectNetwork }) => {
  // Adresi kısaltma fonksiyonu
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Lottery dApp</Link>
      </div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/my-tickets">My Tickets</Link>
        <Link to="/create-lottery">Create Lottery</Link>
        {!isCorrectNetwork && account && (
          <span className="wrong-network-warning">
            Wrong Network
          </span>
        )}
        <button 
          className={`connect-wallet-btn ${!isCorrectNetwork && account ? 'wrong-network' : ''}`}
          onClick={onConnect}
        >
          {account 
            ? isCorrectNetwork 
              ? formatAddress(account)
              : 'Switch to Taiko Hekla'
            : 'Connect Wallet'
          }
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 