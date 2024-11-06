import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './LotteryTable.css';

function LotteryTable({ tableId, participantsCount, reward, ticketTokenAddress, ticketTokenSymbol, onJoin, maxParticipants, isJoined, showTableDetails, userAccount, contractAddress }) {
    const [hasApproval, setHasApproval] = useState(false);

    useEffect(() => {
        // Kontratın harcama yetkisini kontrol eden işlev
        const checkApproval = async () => {
            if (!ticketTokenAddress || !userAccount || !contractAddress) return;

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const tokenContract = new ethers.Contract(ticketTokenAddress, [
                    "function allowance(address owner, address spender) view returns (uint256)"
                ], provider);

                const allowance = await tokenContract.allowance(userAccount, contractAddress);
                
                // `allowance > 0n` şeklinde doğrudan karşılaştırma
                setHasApproval(allowance > 0n); 
            } catch (error) {
                console.error("Allowance kontrolünde hata:", error);
            }
        };

        checkApproval();
    }, [ticketTokenAddress, userAccount, contractAddress]);

    // Approve veya join işlemini başlatan işlev
    const handleButtonClick = () => {
        if (hasApproval) {
            onJoin(tableId, maxParticipants);
        } else {
            // Yetki verme işlemi
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

            // Büyük bir değer belirleyerek onay veriyoruz (örneğin 10**18)
            const tx = await tokenContract.approve(contractAddress, ethers.parseEther("1000000"));
            await tx.wait();
            setHasApproval(true); // Onaylandıktan sonra hasApproval true olur
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
                {isJoined ? "Masa Detaylarını Gör" : hasApproval ? "Join" : "Approve"}
            </button>
        </div>
    );
}

export default LotteryTable;
