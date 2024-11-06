import React, { useState, useEffect } from 'react';
import { ethers, formatEther, parseEther } from 'ethers';
import Header from './components/Header';
import LotteryTable from './components/LotteryTable';
import TableDetailsModal from './components/TableDetailsModal';
import LotteryContractABI from './contracts/LotteryContract.json';
import Erc20ABI from './contracts/erc20.json';
import Erc20json from './contracts/erc20info.json';
import './App.css';
// Rastgele bir sayı üretmek için yardımcı işlev, ekrandaki toplar için.
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Kazananı rastgele seçen işlev
function pickWinner(participants) {
    const winnerIndex = Math.floor(Math.random() * participants.length);
    return participants[winnerIndex];
}
function App() {
    const [account, setAccount] = useState(null);
    const [isTableDetailsOpen, setIsTableDetailsOpen] = useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const [tables, setTables] = useState(
        Array(12).fill().map(() => ({ participants: [], reward: 0, isJoined: false }))
    );
    const [winner, setWinner] = useState(null);
    const [lotteryContract, setLotteryContract] = useState(null);
    const tokenData = {
        "0x2029Ca1e4A5954781a271d6Fa3598bF4434969f5": { name: "Bridged Horse Token", symbol: "HORSE.t" },
        "0x985A9f3B95d6B01e69060483770A34CC3DF569D4": { name: "ChanceX", symbol: "CHX" },
        "0xb65A88D528294B04bF789f1c432a094E148f4E98": { name: "Taiko Token", symbol: "TAIKO" },
        "0x0E75113515F0EC6E03cf881949Aea6e273878f12": { name: "USD Coin", symbol: "USDC" }
    };
    const circles = Array.from({ length: 10 }, (_, index) => (
        <div
            key={index}
            className="circle large"
            style={{
                top: `${getRandomInt(0, 100)}%`,
                left: `${getRandomInt(10, 90)}%`,
                animationDelay: `${index * 1.5}s`,
                transform: `translateX(${getRandomInt(-10, 10)}px) translateY(${getRandomInt(-10, 10)}px)`,
            }}
        >
            {getRandomInt(1, 100)}
        </div>
    ));
    // MetaMask cüzdanını bağlama işlevi
    async function connectWallet() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAccount(accounts[0]);

                // Ethers ile kontrata bağlan
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(
                    "0x22EE4e85FC622Dc55B63F5cf268Cfe8d6Ff5F3aE", // Akıllı kontrat adresini buraya girin
                    LotteryContractABI.abi,
                    signer
                );
                setLotteryContract(contract);
            } catch (error) {
                console.error("Cüzdan bağlantısı başarısız:", error);
            }
        } else {
            alert("Lütfen MetaMask'i yükleyin!");
        }
    }

    // Akıllı kontrattan lottery bilgilerini almak için işlev
    const fetchLotteries = async () => {
        console.log("start fetchLotteries")
        console.log(lotteryContract)
        if (!lotteryContract) return;

        try {
            console.log("try fetchLotteries")
            // Son 9 lottery verisini kontrattan çek
            const lotteries = await lotteryContract.getLastLotteries(9);
            console.log(lotteries)
            // Tuple verisini kendi özel obje yapına dönüştür
            const mappedLotteries = lotteries.map(lottery => ({
                id: Number(lottery[0]), // `BigInt` olarak gelir, güvenle `Number`'a dönüştürülebilir
                startBlock: Number(lottery[1]),
                startTime: new Date(Number(lottery[2]) * 1000), // Unix timestamp'i JS Date'e çeviriyoruz
                participants: lottery[3],
                isActive: lottery[4],
                winner: lottery[5],
                ticketTokenAddress: lottery[6], // BigInt ETH değerini formatlıyoruz
                participationFee: formatEther(lottery[7]),
                serviceFee: Number(lottery[8]),
                participantLimit: Number(lottery[9])
            }));
            console.log(lotteryContract)
            const mappedLotteries1 = mappedLotteries.map(lottery => ({
                ...lottery,
                tokenInfo: tokenData[lottery.ticketTokenAddress] || { name: "Unknown", symbol: "Unknown" },
                reward: lottery.participants.length * lottery.participationFee,
                contractAddress: lotteryContract["target"],
                userAccount: account
            }));

            console.log(mappedLotteries1)

            setTables(
                mappedLotteries1
            );
        } catch (error) {
            console.error("Lottery verileri alınamadı:", error);
        }
    };

    useEffect(() => {
        fetchLotteries();
    }, [lotteryContract, account]);

    // Katılma işlemini yöneten işlev
    const onJoinTable = async (tableId, maxParticipants) => {
        if (!account) {
            connectWallet();
            return;
        }

        try {
            console.log("start onJoinTable tableId:", tableId)
            // Katılım işlemini kontrata göndermek
            const tx = await lotteryContract.participate(tableId); // Örnek olarak 0.01 ETH
            await tx.wait();
            fetchLotteries()
            // Katılımcıyı güncelle ve UI'de göster
            // setTables((prevTables) => {
            //     const updatedTable = {
            //         ...prevTables[tableId - 1],
            //         participants: [...prevTables[tableId - 1].participants, account],
            //         reward: prevTables[tableId - 1].reward + 1,
            //         isJoined: true
            //     };
            //     const newTables = [...prevTables];
            //     newTables[tableId - 1] = updatedTable;

            //     // Maksimum katılımcıya ulaşıldığında kazananı belirle
            //     if (updatedTable.participants.length >= maxParticipants) {
            //         const selectedWinner = pickWinner(updatedTable.participants);
            //         setWinner(selectedWinner);
            //     }
            //     return newTables;
            // });

            // setCurrentTable(tableId);
            // setIsTableDetailsOpen(true);
        } catch (error) {
            console.error("Katılım işlemi başarısız:", error);
        }
    };

    // Masa Detayları Modali Açma İşlevi
    const showTableDetails = (tableId) => {
        setCurrentTable(tableId);
        setIsTableDetailsOpen(true);
    };

    const closeTableDetailsModal = () => {
        setIsTableDetailsOpen(false);
        setWinner(null);
    };

    return (
        <div>
            <div className="side-panel left-panel">{circles}</div>
            <div className="side-panel right-panel">{circles}</div>

            <Header account={account} onConnectWallet={connectWallet} />
            <main style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Lot-Chain Piyango Masaları</h1>

                <div className="lottery-tables-container">
                    {tables.map((table, index) => (
                        <LotteryTable
                            key={index}
                            account={account}
                            onJoin={onJoinTable}
                            tableId={table.id}
                            maxParticipants={table.participantLimit}
                            participantsCount={table.participants.length}
                            reward={table.reward}
                            ticketTokenAddress={table.ticketTokenAddress}
                            ticketTokenSymbol={table.tokenInfo?.symbol}
                            isJoined={table.isJoined}
                            userAccount={table.userAccount}
                            contractAddress={table.contractAddress}
                            showTableDetails={showTableDetails}
                        />
                    ))}
                </div>
            </main>

            {isTableDetailsOpen && currentTable && (
                <TableDetailsModal
                    tableId={currentTable}
                    participants={tables[currentTable - 1].participants}
                    userAccount={account}
                    reward={tables[currentTable - 1].reward}
                    onClose={closeTableDetailsModal}
                    winner={winner}
                />
            )}
        </div>
    );
}

export default App;
