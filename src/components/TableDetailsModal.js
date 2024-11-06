// TableDetailsModal.js
import React from 'react';
import './TableDetailsModal.css';

function TableDetailsModal({ tableId, participants, userAccount, reward, onClose, winner }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Table #{tableId} Details</h2>
                <p>Total Reward: {reward} Taiko</p>
                <p>Participants:</p>
                <div className="participants-list">
                    {participants.map((participant, index) => {
                        const isUser = participant === userAccount;
                        const isWinner = winner === participant;
                        return (
                            <p
                                key={index}
                                className={`participant ${isUser ? 'user-account' : ''} ${isWinner ? 'winner-account' : ''}`}
                            >
                                {participant.slice(0, 4)}...{participant.slice(-4)}
                            </p>
                        );
                    })}
                </div>
                <button onClick={onClose} className="close-button">Close</button>
            </div>
        </div>
    );
}

export default TableDetailsModal;
