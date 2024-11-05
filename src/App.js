import React, { useState } from 'react';
import { ethers } from 'ethers';
import Header from './components/Header';
import LotteryTable from './components/LotteryTable';
import TableDetailsModal from './components/TableDetailsModal';
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
    const [account, setAccount] = useState(null); // Cüzdan adresi durumu
    const [isTableDetailsOpen, setIsTableDetailsOpen] = useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const [tables, setTables] = useState(
        Array(6).fill().map(() => ({ participants: [], reward: 0, isJoined: false }))
    );
    const [winner, setWinner] = useState(null);

    // MetaMask cüzdanını bağlama işlevi
    async function connectWallet() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAccount(accounts[0]);
            } catch (error) {
                console.error("Cüzdan bağlantısı başarısız:", error);
            }
        } else {
            alert("Lütfen MetaMask'i yükleyin!");
        }
    }

    // Animasyonlu topların sayısı
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
        // Sahte Taiko token bakiyesi kontrol işlevi (gerçek bir kontrol için blockchain API kullanılmalı)
    async function checkTaikoBalance(account) {
        // Burada cüzdanın Taiko token bakiyesini kontrol etmek için gerçek bir çağrı yapabilirsiniz
        // Şimdilik yeterli bakiyeye sahip olduğunu varsayıyoruz
        const fakeBalance = 2; // Örnek bakiye
        return fakeBalance >= 1;
    }

    // Katılma işlemini yöneten işlev
    const onJoinTable = async (tableId, maxParticipants) => {
        if (!account) {
            connectWallet();
            return;
        }

        const tableIndex = tableId - 1;

        // Taiko token yeterli mi kontrol et
        const hasEnoughTaiko = await checkTaikoBalance(account);
        if (!hasEnoughTaiko) {
            alert("Yetersiz Taiko token.");
            return;
        }

        setTables((prevTables) => {
            // En güncel tablo durumunu kontrol et ve tekrar katılımı önle
            if (prevTables[tableIndex].participants.includes(account)) {
                alert("Bu masaya zaten katıldınız.");
                return prevTables; // Aynı tabloyu döndür, değişiklik yok
            }

            // Yeni katılımcı ekle
            const updatedTable = {
                ...prevTables[tableIndex],
                participants: [...prevTables[tableIndex].participants, account],
                reward: prevTables[tableIndex].reward + 1,
                isJoined: true
            };

            const newTables = [...prevTables];
            newTables[tableIndex] = updatedTable;

            // Maksimum katılımcıya ulaşıldığında kazananı belirle
            if (updatedTable.participants.length >= maxParticipants) {
                const selectedWinner = pickWinner(updatedTable.participants);
                setWinner(selectedWinner);
            }

            return newTables;
        });

        setCurrentTable(tableId);
        setIsTableDetailsOpen(true);
    };

    // Masa Detayları Modali Açma İşlevi
    const showTableDetails = (tableId) => {
        setCurrentTable(tableId);
        setIsTableDetailsOpen(true);
    };


    // Modal kapatma işlevi
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
                            tableId={index + 1}
                            maxParticipants={index < 3 ? 5 : 10}
                            participantsCount={table.participants.length}
                            reward={table.reward}
                            isJoined={table.isJoined}
                            showTableDetails={showTableDetails} // showTableDetails işlevini gönderiyoruz
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
