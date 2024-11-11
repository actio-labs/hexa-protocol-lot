import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './LotteryTable.css';
import PropTypes from 'prop-types';

function LotteryTable({ tableId, participantsCount, reward, ticketTokenAddress, ticketTokenSymbol, onJoin, maxParticipants, isJoined, showTableDetails, userAccount, contractAddress }) {
    const [hasApproval, setHasApproval] = useState(false);

    useEffect(() => {
        const checkApproval = async () => {
            if (!ticketTokenAddress || !userAccount || !contractAddress) return;
            
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const tokenContract = new ethers.Contract(ticketTokenAddress, [
                    "function allowance(address owner, address spender) view returns (uint256)"
                ], provider);

                const allowance = await tokenContract.allowance(userAccount, contractAddress);
                const requiredAmount = ethers.parseEther(reward.toString());
                setHasApproval(allowance >= requiredAmount);
            } catch (error) {
                console.error("Allowance kontrolünde hata:", error);
            }
        };

        checkApproval();
    }, [ticketTokenAddress, userAccount, contractAddress]);

    const connectWallet = async () => {
        if (!window.ethereum) return;

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            console.error("Cüzdan bağlantısında hata:", error);
        }
    };

    const handleButtonClick = async () => {
        if (!userAccount) {
            await connectWallet();
            return;
        }

        if (isJoined) {
            showTableDetails(tableId);
        } else if (hasApproval) {
            onJoin(tableId, maxParticipants);
        } else {
            approveToken();
        }
    };

    const approveToken = async () => {
        if (!ticketTokenAddress || !userAccount || !contractAddress) return;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const tokenContract = new ethers.Contract(ticketTokenAddress, [
                "function approve(address spender, uint256 amount) public returns (bool)"
            ], signer);

            const tx = await tokenContract.approve(contractAddress, ethers.parseEther("1000000"));
            await tx.wait();
            setHasApproval(true);
        } catch (error) {
            console.error("Approve işleminde hata:", error);
        }
    };

    return (
        <div className="lottery-table">
            <h2>Piyango Masası #{tableId}</h2>
            <p>Katılımcı Sayısı: {participantsCount}/{maxParticipants}</p>
            <p>Ödül Havuzu: {reward} {ticketTokenSymbol}</p>
            <button
                className="join-button"
                onClick={handleButtonClick}
            >
                {!userAccount ? "Cüzdanı Bağla" : 
                    isJoined ? "Masa Detaylarını Gör" : 
                    hasApproval ? "Join" : "Approve"}
            </button>
        </div>
    );
}

LotteryTable.propTypes = {
    tableId: PropTypes.number.isRequired,
    participantsCount: PropTypes.number.isRequired,
    reward: PropTypes.string.isRequired,
    ticketTokenAddress: PropTypes.string.isRequired,
    ticketTokenSymbol: PropTypes.string.isRequired,
    onJoin: PropTypes.func.isRequired,
    maxParticipants: PropTypes.number.isRequired,
    isJoined: PropTypes.bool.isRequired,
    showTableDetails: PropTypes.func,
    userAccount: PropTypes.string,
    contractAddress: PropTypes.string.isRequired,
};

export default LotteryTable;
