import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import erc20ABI from '../contracts/erc20.json';
import WinnerModal from './WinnerModal';

const LotteryList = ({ lotteries, account, lotteryContract }) => {
  const [approvals, setApprovals] = useState({});
  const [loading, setLoading] = useState({});
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winningPrize, setWinningPrize] = useState({ amount: 0, symbol: '' });

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
      
      // ERC20 token kontratı için minimum gerekli fonksiyonları içeren ABI
      const minimalABI = [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
      ];

      const tokenContract = new ethers.Contract(
        lottery.ticketTokenAddress,
        minimalABI,
        signer
      );

      // MaxUint256 değerini kullan
      const maxAmount = ethers.MaxUint256;

      console.log("Approving...", {
        tokenAddress: lottery.ticketTokenAddress,
        spender: lotteryContract.target,
        amount: maxAmount.toString()
      });

      const tx = await tokenContract.approve(
        lotteryContract.target,
        maxAmount
      );

      console.log("Approval transaction:", tx.hash);
      await tx.wait();
      console.log("Approval confirmed");
      
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
    
    // Cüzdan bağlı değilse
    if (!account) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        return;
      } catch (error) {
        console.error("Wallet connection failed:", error);
        return;
      }
    }

    // Cüzdan bağlıysa ve approve yoksa
    if (!approvals[lottery.id]) {
      try {
        await handleApprove(lottery);
      } catch (error) {
        console.error("Approve failed:", error);
      }
    } else {
      // Approve varsa join işlemi
      try {
        await handleJoin(lottery);
      } catch (error) {
        console.error("Join failed:", error);
      }
    }
  };

  // Piyangolar için sıralama fonksiyonu
  const sortLotteries = (lotteries) => {
    // Aktif ve bitmiş piyangolar için ayrı diziler oluştur
    const activeLotteries = lotteries.filter(lottery => lottery.isActive);
    const endedLotteries = lotteries.filter(lottery => !lottery.isActive);

    // Aktif piyangolar ID'ye göre sıralanır (en yeni üstte)
    const sortedActiveLotteries = activeLotteries.sort((a, b) => b.id - a.id);

    // Bitmiş piyangolar bitiş zamanına göre sıralanır (en son biten üstte)
    const sortedEndedLotteries = endedLotteries.sort((a, b) => b.endTime - a.endTime);

    // İlk 10 aktif piyango ve tüm bitmiş piyangolar birleştirilir
    return [...sortedActiveLotteries.slice(0, 10), ...sortedEndedLotteries];
  };

  // Kazanan kontrolü
  useEffect(() => {
    if (account && lotteries.length > 0) {
      lotteries.forEach(lottery => {
        if (!lottery.isActive && 
            lottery.winner?.toLowerCase() === account.toLowerCase() &&
            !localStorage.getItem(`prize_claimed_${lottery.id}`)) {
          setWinningPrize({
            amount: lottery.participationFee * lottery.participantLimit,
            symbol: lottery.tokenInfo.symbol
          });
          setShowWinnerModal(true);
        }
      });
    }
  }, [account, lotteries]);

  const handleClaimPrize = () => {
    // Burada ödül talep işlemleri yapılabilir
    setShowWinnerModal(false);
    // Aynı modalın tekrar gösterilmemesi için localStorage'a kaydet
    localStorage.setItem(`prize_claimed_${lottery.id}`, 'true');
  };

  return (
    <>
      <div className="lottery-list">
        {/* Aktif Piyangolar Başlığı */}
        {sortLotteries(lotteries).filter(lottery => lottery.isActive).length > 0 && (
          <h2 className="section-title">Active Lotteries</h2>
        )}
        
        {/* Aktif Piyangolar */}
        {sortLotteries(lotteries)
          .filter(lottery => lottery.isActive)
          .map((lottery) => (
            <div key={lottery.id} className="lottery-card active">
              <div className="card-top">
                <div className="reward-pool">
                  <div className="reward-label">WON</div>
                  <div className="reward-amount">
                    {lottery.participationFee * lottery.participantLimit}
                    <span className="reward-token">{lottery.tokenInfo.symbol}</span>
                  </div>
                </div>

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
                            className={`address-chip ${
                              address.toLowerCase() === account?.toLowerCase() 
                                ? 'current-user' 
                                : address.toLowerCase() === lottery.winner?.toLowerCase() 
                                  ? 'winner-user'
                                  : 'other-user'
                            }`}
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
                    <span className="info-label">Entry Price</span>
                    <span className="info-value">
                      {lottery.participationFee} {lottery.tokenInfo.symbol}
                    </span>
                  </div>
                </div>
                {lottery.isActive && (
                  <button 
                    className={`action-button ${loading[lottery.id] ? 'processing' : ''}`}
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

        {/* Bitmiş Piyangolar Başlığı */}
        {sortLotteries(lotteries).filter(lottery => !lottery.isActive).length > 0 && (
          <h2 className="section-title">Ended Lotteries</h2>
        )}
        
        {/* Bitmiş Piyangolar */}
        {sortLotteries(lotteries)
          .filter(lottery => !lottery.isActive)
          .map((lottery) => (
            <div key={lottery.id} className="lottery-card ended">
              <div className="card-top">
                <div className="reward-pool">
                  <div className="reward-label">WON</div>
                  <div className="reward-amount">
                    {lottery.participationFee * lottery.participantLimit}
                    <span className="reward-token">{lottery.tokenInfo.symbol}</span>
                  </div>
                </div>

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
                            className={`address-chip ${
                              address.toLowerCase() === account?.toLowerCase() 
                                ? 'current-user' 
                                : address.toLowerCase() === lottery.winner?.toLowerCase() 
                                  ? 'winner-user'
                                  : 'other-user'
                            }`}
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
                    <span className="info-label">Entry Price</span>
                    <span className="info-value">
                      {lottery.participationFee} {lottery.tokenInfo.symbol}
                    </span>
                  </div>
                </div>
                {lottery.isActive && (
                  <button 
                    className={`action-button ${loading[lottery.id] ? 'processing' : ''}`}
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

      <WinnerModal 
        isOpen={showWinnerModal}
        onClose={handleClaimPrize}
        prize={winningPrize.amount}
        tokenSymbol={winningPrize.symbol}
      />
    </>
  );
};

export default LotteryList;