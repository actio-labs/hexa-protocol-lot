import React from 'react';
import './LotteryTable.css';

function LotteryTable({ tableId, participantsCount, reward,ticketTokenAddress, onJoin, maxParticipants, isJoined, showTableDetails }) {
    return (
        <div className="lottery-table">
            <h2>Piyango Masası #{tableId}</h2>
            <p>Katılımcı Sayısı: {participantsCount}/{maxParticipants}</p>
            <p>Ödül Havuzu: {reward} {ticketTokenAddress}</p>
            <button
                className="join-button"
                onClick={() => isJoined ? showTableDetails(tableId) : onJoin(tableId, maxParticipants)}
            >
                {isJoined ? "Masa Detaylarını Gör" : "Katıl"}
            </button>
        </div>
    );
}

export default LotteryTable;
