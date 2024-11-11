import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import erc20ABI from '../contracts/erc20.json';

const LotteryList = ({ lotteries, account, lotteryContract }) => {
  const [approvals, setApprovals] = useState({});
  const [loading, setLoading] = useState({});

  // Token onaylarını kontrol et
  const checkApproval = async (lottery) => {
    if (!lottery.ticketTokenAddress || !account || !lotteryContract?.target) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(
        lottery.ticketTokenAddress,
        ["function allowance(address owner, address spender) view returns (uint256)"],
        provider
      );

      const allowance = await tokenContract.allowance(account, lotteryContract.target);
      setApprovals(prev => ({
        ...prev,
        [lottery.id]: allowance > 0n
      }));
    } catch (error) {
      console.error("Allowance check failed for lottery", lottery.id, ":", error);
    }
  };

  // Her lottery için approval durumunu kontrol et
  useEffect(() => {
    if (account && lotteries.length > 0 && lotteryContract) {
      lotteries.forEach(lottery => {
        checkApproval(lottery);
      });
    }
  }, [account, lotteries, lotteryContract]);

  // Approve işlemi
  const handleApprove = async (lottery) => {
    if (!account || !lottery.ticketTokenAddress || !lotteryContract?.target) return;

    setLoading(prev => ({ ...prev, [lottery.id]: true }));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(
        lottery.ticketTokenAddress,
        ["function approve(address spender, uint256 amount) public returns (bool)"],
        signer
      );

      const tx = await tokenContract.approve(
        lotteryContract.target,
        ethers.parseEther("1000000")
      );
      await tx.wait();
      
      await checkApproval(lottery);
    } catch (error) {
      console.error("Approve failed:", error);
    } finally {
      setLoading(prev => ({ ...prev, [lottery.id]: false }));
    }
  };

  // Join işlemi
  const handleJoin = async (lottery) => {
    if (!account || !lotteryContract) return;

    setLoading(prev => ({ ...prev, [lottery.id]: true }));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = lotteryContract.connect(signer);

      const tx = await contractWithSigner.participate(lottery.id);
      await tx.wait();
    } catch (error) {
      console.error("Join failed:", error);
    } finally {
      setLoading(prev => ({ ...prev, [lottery.id]: false }));
    }
  };

  // Buton işlemi
  const handleButtonClick = async (lottery) => {
    if (loading[lottery.id]) return;
    
    if (!account) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            return;
        } catch (error) {
            console.error("Wallet connection failed:", error);
            return;
        }
    }

    if (!approvals[lottery.id]) {
        handleApprove(lottery);
    } else {
        handleJoin(lottery);
    }
  };

  return (
    <div className="lottery-list">
      {lotteries.map((lottery) => (
        <div 
          key={lottery.id} 
          className={`lottery-card ${lottery.isActive ? 'active' : 'ended'}`}
        >
          <div className="card-top">
            <div className="token-section">
              <div className={`token-logo ${lottery.tokenInfo.symbol !== 'USDC' && lottery.tokenInfo.symbol !== 'TAIKO' ? 'grayscale' : ''}`}>
                <img 
                  src={`/hexa-protocol-lot/${lottery.tokenInfo.symbol.toLowerCase()}pnglogo.png`}
                  alt={lottery.tokenInfo.symbol}
                  onError={(e) => {
                    e.target.src = `${process.env.PUBLIC_URL}/taikopnglogo.png`;
                  }}
                />
              </div>
              <div className="token-info">
                <div className="token-name-wrapper">
                  <h2>{lottery.tokenInfo.name}</h2>
                  <span className="token-symbol">{lottery.tokenInfo.symbol}</span>
                </div>
                <div className="lottery-id">#{lottery.id}</div>
              </div>
            </div>
            <div className="price-section">
              <div className="price-tag">Entry Price</div>
              <div className="price-value">
                {lottery.participationFee} {lottery.tokenInfo.symbol}
              </div>
            </div>
          </div>
          
          <div className="card-middle">
            <div className="status-section">
              <div className={`status-badge ${lottery.isActive ? 'active' : 'ended'}`}>
                {lottery.isActive ? 'Active' : 'Ended'}
              </div>
              <div className="time-info">
                {lottery.isActive ? 'In Progress' : 'Sale ended'}
              </div>
            </div>
            
            <div className="progress-section">
              <div className="progress-header">
                <span>Participants</span>
                <span className="progress-numbers">
                  {lottery.participants.length}/{lottery.participantLimit}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{width: `${(lottery.participants.length / lottery.participantLimit) * 100}%`}}
                >
                  <span className="progress-percent">
                    {Math.round((lottery.participants.length / lottery.participantLimit) * 100)}%
                  </span>
                </div>
              </div>
              {lottery.participants.length > 0 && (
                <div className="participants-list">
                  <div className="participants-label">Current Participants:</div>
                  <div className="address-chips">
                    {lottery.participants.map((address, index) => (
                      <div 
                        key={index} 
                        className={`address-chip ${address.toLowerCase() === account?.toLowerCase() ? 'current-user' : 'other-user'}`} 
                        title={address}
                      >
                        {`${address.slice(0, 4)}...${address.slice(-4)}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="card-bottom">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Service Fee</span>
                <span className="info-value">{lottery.serviceFee}%</span>
              </div>
              <div className="info-item">
                <span className="info-label">Reward Pool</span>
                <span className="info-value">
                  {lottery.reward} {lottery.tokenInfo.symbol}
                </span>
              </div>
            </div>
            {lottery.isActive && (
              <button 
                className={`action-button ${loading[lottery.id] ? 'disabled' : ''}`}
                onClick={() => handleButtonClick(lottery)}
                disabled={loading[lottery.id]}
              >
                {loading[lottery.id] 
                  ? "Processing..." 
                  : !account 
                    ? "Connect Wallet"
                    : approvals[lottery.id] 
                      ? "Join" 
                      : "Approve"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LotteryList;