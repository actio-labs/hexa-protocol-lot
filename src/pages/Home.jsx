import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LotteryList from '../components/LotteryList';
import LotteryContractABI from '../contracts/LotteryContract.json';

function Home({ account }) {
  const [lotteries, setLotteries] = useState([]);
  const [lotteryContract, setLotteryContract] = useState(null);

  const HEKLA_RPC_URL = "https://rpc.hekla.taiko.xyz";
  const CONTRACT_ADDRESS = "0x22EE4e85FC622Dc55B63F5cf268Cfe8d6Ff5F3aE";

  const tokenData = {
    "0x2029Ca1e4A5954781a271d6Fa3598bF4434969f5": { name: "Bridged Horse Token", symbol: "HORSE.t" },
    "0x985A9f3B95d6B01e69060483770A34CC3DF569D4": { name: "ChanceX", symbol: "CHX" },
    "0xb65A88D528294B04bF789f1c432a094E148f4E98": { name: "Taiko Token", symbol: "TAIKO" },
    "0x0E75113515F0EC6E03cf881949Aea6e273878f12": { name: "USD Coin", symbol: "USDC" }
  };

  // Kontrat kurulumu - RPC provider kullanarak
  const setupContract = async () => {
    try {
      // RPC provider oluştur
      const provider = new ethers.JsonRpcProvider(HEKLA_RPC_URL);
      
      // Kontratı RPC provider ile başlat
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        LotteryContractABI.abi,
        provider
      );
      
      setLotteryContract(contract);
      console.log("Contract setup successful with RPC provider");
    } catch (error) {
      console.error("Contract setup failed:", error);
    }
  };

  // Piyango verilerini çek
  const fetchLotteryData = async () => {
    console.log("start fetchLotteryData")
    console.log(lotteryContract)
    if (!lotteryContract) return;

    try {
        console.log("try fetchLotteryData")
        // Son 9 lottery verisini kontrattan çek
        const lotteries = await lotteryContract.getLastLotteries(9);
        console.log("Fetched lotteries:", lotteries)

        // Tuple verisini kendi özel obje yapına dönüştür
        const mappedLotteries = lotteries.map(lottery => ({
            id: Number(lottery[0]),
            startBlock: Number(lottery[1]),
            startTime: new Date(Number(lottery[2]) * 1000),
            participants: lottery[3], // Katılımcı adresleri dizisi
            isActive: lottery[4],
            winner: lottery[5],
            ticketTokenAddress: lottery[6],
            participationFee: ethers.formatEther(lottery[7]),
            serviceFee: Number(lottery[8]),
            participantLimit: Number(lottery[9])
        }));

        // Token bilgilerini ve diğer hesaplanmış değerleri ekle
        const enrichedLotteries = mappedLotteries.map(lottery => ({
            ...lottery,
            tokenInfo: tokenData[lottery.ticketTokenAddress] || { 
                name: "Unknown Token", 
                symbol: lottery.ticketTokenAddress.slice(0, 6) 
            },
            reward: lottery.participants.length * Number(lottery.participationFee),
            contractAddress: lotteryContract.target,
            userAccount: account
        }));

        console.log("Enriched lotteries:", enrichedLotteries);
        setLotteries(enrichedLotteries);

    } catch (error) {
        console.error("Failed to fetch lottery data:", error);
    }
};

  // Kullanıcının cüzdanını bağla
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Piyangoya katıl
  const joinLottery = async (lottery) => {
    if (!account) {
      const connectedAccount = await connectWallet();
      if (!connectedAccount) return;
    }

    try {
      // MetaMask provider ve signer oluştur
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Kontratı signer ile bağla
      const contractWithSigner = lotteryContract.connect(signer);
      
      const tx = await contractWithSigner.participate(lottery.id);
      await tx.wait();
      alert("Successfully joined the lottery!");
      fetchLotteryData(); // Update the lottery data
    } catch (error) {
      console.error("Failed to join lottery:", error);
      alert("Failed to join lottery: " + error.message);
    }
  };

  // Sayfa yüklendiğinde kontratı kur
  useEffect(() => {
    setupContract();
  }, []);

  // Kontrat kurulduğunda verileri çek
  useEffect(() => {
    if (lotteryContract) {
      fetchLotteryData();
      const interval = setInterval(fetchLotteryData, 10000);
      return () => clearInterval(interval);
    }
  }, [lotteryContract, account]);

  return (
    <div className="home">
      <h1>Active Lotteries</h1>
      <LotteryList 
        lotteries={lotteries}
        account={account}
        lotteryContract={lotteryContract}
        onJoin={joinLottery}
      />
    </div>
  );
}

export default Home;