import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LotteryContractABI from '../contracts/LotteryContract.json';

function ContractManager() {
    const [contract, setContract] = useState(null);
    const [manager, setManager] = useState(null);
    const [treasury, setTreasury] = useState(null);
    const [currentLotteryId, setCurrentLotteryId] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedLotteryId, setSelectedLotteryId] = useState('');
    const [lotteryDetails, setLotteryDetails] = useState(null);
    const [fundAmount, setFundAmount] = useState('');
    const [lotteryCount, setLotteryCount] = useState('');

    const CONTRACT_ADDRESS = "0x54e17216aD4A4BbA8F7F9314a036F8373Cc4a91e";
    const HEKLA_RPC_URL = "https://rpc.hekla.taiko.xyz";

    // Kontrat kurulumu
    useEffect(() => {
        const setupContract = async () => {
            try {
                // Önce read-only provider ile bağlan
                const readProvider = new ethers.JsonRpcProvider(HEKLA_RPC_URL);
                const readOnlyContract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    LotteryContractABI.abi,
                    readProvider
                );

                // Kontrat bilgilerini çek
                const managerAddress = await readOnlyContract.manager();
                const treasuryAddress = await readOnlyContract.treasury();
                const lotteryId = await readOnlyContract.currentLotteryId();

                setManager(managerAddress);
                setTreasury(treasuryAddress);
                setCurrentLotteryId(Number(lotteryId));

                // Eğer MetaMask varsa, write işlemleri için signer ile kontratı ayarla
                if (window.ethereum) {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await provider.getSigner();
                    const contractWithSigner = new ethers.Contract(
                        CONTRACT_ADDRESS,
                        LotteryContractABI.abi,
                        signer
                    );
                    setContract(contractWithSigner);
                } else {
                    setContract(readOnlyContract);
                }
            } catch (error) {
                console.error("Contract setup failed:", error);
            }
        };

        setupContract();
    }, []);

    // Lottery detaylarını çek
    const fetchLotteryDetails = async (id) => {
        if (!contract || !id) return;

        try {
            setLoading(true);
            const details = await contract.getLotteryDetails(id);
            setLotteryDetails({
                id: Number(details[0]),
                startBlock: Number(details[1]),
                startTime: new Date(Number(details[2]) * 1000),
                participants: details[3],
                isActive: details[4],
                winner: details[5],
                ticketToken: details[6],
                ticketPrice: ethers.formatEther(details[7]),
                serviceFee: Number(details[8]),
                participantLimit: Number(details[9])
            });
        } catch (error) {
            console.error("Failed to fetch lottery details:", error);
            alert("Failed to fetch lottery details: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Kontrata ETH yükle
    const handleFundContract = async () => {
        if (!contract || !fundAmount) return;

        try {
            setLoading(true);
            const tx = await contract.fundContract({
                value: ethers.parseEther(fundAmount)
            });
            await tx.wait();
            alert("Contract funded successfully!");
            setFundAmount('');
        } catch (error) {
            console.error("Failed to fund contract:", error);
            alert("Failed to fund contract: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Son lotteryleri getir
    const handleGetLastLotteries = async () => {
        if (!contract || !lotteryCount) return;

        try {
            setLoading(true);
            const lotteries = await contract.getLastLotteries(Number(lotteryCount));
            console.log("Last lotteries:", lotteries);
            alert(`Retrieved ${lotteries.length} lotteries. Check console for details.`);
            setLotteryCount('');
        } catch (error) {
            console.error("Failed to get last lotteries:", error);
            alert("Failed to get last lotteries: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contract-manager-container">
            <h1>Contract Manager</h1>

            <div className="info-section">
                <h2>Contract Information</h2>
                <p><strong>Contract Address:</strong> {CONTRACT_ADDRESS}</p>
                <p><strong>Manager Address:</strong> {manager}</p>
                <p><strong>Treasury Address:</strong> {treasury}</p>
                <p><strong>Current Lottery ID:</strong> {currentLotteryId}</p>
            </div>

            <div className="actions-section">
                <h2>Contract Actions</h2>

                {/* Fund Contract */}
                <div className="action-card">
                    <h3>Fund Contract</h3>
                    <div className="form-group">
                        <input 
                            type="number" 
                            placeholder="Amount in ETH"
                            step="0.01"
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                        />
                        <button 
                            onClick={handleFundContract}
                            disabled={loading || !fundAmount}
                            className="action-button"
                        >
                            {loading ? "Processing..." : "Fund Contract"}
                        </button>
                    </div>
                </div>

                {/* Get Lottery Details */}
                <div className="action-card">
                    <h3>Get Lottery Details</h3>
                    <div className="form-group">
                        <input 
                            type="number"
                            placeholder="Lottery ID"
                            value={selectedLotteryId}
                            onChange={(e) => setSelectedLotteryId(e.target.value)}
                        />
                        <button 
                            onClick={() => fetchLotteryDetails(selectedLotteryId)}
                            disabled={loading || !selectedLotteryId}
                            className="action-button"
                        >
                            {loading ? "Loading..." : "Get Details"}
                        </button>
                    </div>
                    {lotteryDetails && (
                        <div className="details-display">
                            <h4>Lottery #{lotteryDetails.id} Details</h4>
                            <p>Start Time: {lotteryDetails.startTime.toLocaleString()}</p>
                            <p>Active: {lotteryDetails.isActive ? "Yes" : "No"}</p>
                            <p>Winner: {lotteryDetails.winner || "Not determined"}</p>
                            <p>Ticket Price: {lotteryDetails.ticketPrice} ETH</p>
                            <p>Service Fee: {lotteryDetails.serviceFee}%</p>
                            <p>Participants: {lotteryDetails.participants.length}/{lotteryDetails.participantLimit}</p>
                        </div>
                    )}
                </div>

                {/* Get Last Lotteries */}
                <div className="action-card">
                    <h3>Get Last Lotteries</h3>
                    <div className="form-group">
                        <input 
                            type="number"
                            placeholder="Number of lotteries"
                            value={lotteryCount}
                            onChange={(e) => setLotteryCount(e.target.value)}
                        />
                        <button 
                            onClick={handleGetLastLotteries}
                            disabled={loading || !lotteryCount}
                            className="action-button"
                        >
                            {loading ? "Loading..." : "Get Last Lotteries"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContractManager;