import React from 'react';
import './LotteryTable.css';

function LotteryTable({ tableId, participantsCount, reward, ticketTokenAddress, ticketTokenSymbol, onJoin, maxParticipants, isJoined, showTableDetails }) {
    return (
        <div className="lottery-table">
            <h2>Piyango Masası #{tableId}</h2>
            <p>Katılımcı Sayısı: {participantsCount}/{maxParticipants}</p>
            <p>Ödül Havuzu: {reward} {ticketTokenSymbol}</p>
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
