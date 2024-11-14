import React from 'react';

const WinnerModal = ({ isOpen, onClose, prize, tokenSymbol }) => {
  if (!isOpen) return null;

  return (
    <div className="winner-modal-overlay">
      <div className="winner-modal">
        <div className="winner-modal-content">
          <div className="confetti-animation">🎉</div>
          <h2>Congratulations!</h2>
          <h3>You Won The Lottery!</h3>
          <div className="prize-amount">
            <span className="amount">{prize}</span>
            <span className="token">{tokenSymbol}</span>
          </div>
          <button className="close-button" onClick={onClose}>
            Claim Prize
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal; 