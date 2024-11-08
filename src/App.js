import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import Layout from './components/Layout';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import CreateLottery from './pages/CreateLottery';
import ContractManager from './pages/ContractManager';
import './styles/main.css';

function App() {
    const [account, setAccount] = useState(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const TAIKO_HEKLA_CHAIN_ID = '0x28c61';

    // Ağ kontrolü
    const checkNetwork = async () => {
        if (!window.ethereum) return false;
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            return chainId === TAIKO_HEKLA_CHAIN_ID;
        } catch (error) {
            console.error("Failed to get chainId:", error);
            return false;
        }
    };

    // Cüzdan ve ağ durumunu kontrol et
    const checkWalletAndNetwork = async () => {
        if (!window.ethereum) {
            setIsInitializing(false);
            return;
        }

        try {
            // Önce localStorage'dan hesap kontrolü yap
            const savedAccount = localStorage.getItem('connectedAccount');
            
            // Eğer kayıtlı hesap varsa, MetaMask'tan hesapları kontrol et
            if (savedAccount) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    const isCorrect = await checkNetwork();
                    setIsCorrectNetwork(isCorrect);
                } else {
                    // Eğer MetaMask'ta hesap yoksa localStorage'ı temizle
                    localStorage.removeItem('connectedAccount');
                    setAccount(null);
                }
            }
        } catch (error) {
            console.error("Wallet check failed:", error);
            localStorage.removeItem('connectedAccount');
        } finally {
            setIsInitializing(false);
        }
    };

    // Bağlantı işleyicisi
    const handleConnect = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        setIsInitializing(true);
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                // Bağlanan hesabı localStorage'a kaydet
                localStorage.setItem('connectedAccount', accounts[0]);
                
                const isCorrect = await checkNetwork();
                setIsCorrectNetwork(isCorrect);
            }
        } catch (error) {
            console.error('Failed to connect:', error);
            localStorage.removeItem('connectedAccount');
        } finally {
            setIsInitializing(false);
        }
    };

    // Event listeners
    useEffect(() => {
        checkWalletAndNetwork();

        if (window.ethereum) {
            window.ethereum.on('chainChanged', async (chainId) => {
                setIsInitializing(true);
                const isCorrect = chainId === TAIKO_HEKLA_CHAIN_ID;
                setIsCorrectNetwork(isCorrect);
                setIsInitializing(false);
            });

            window.ethereum.on('accountsChanged', (accounts) => {
                setIsInitializing(true);
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    // Hesap değiştiğinde localStorage'ı güncelle
                    localStorage.setItem('connectedAccount', accounts[0]);
                    checkNetwork().then(setIsCorrectNetwork);
                } else {
                    setAccount(null);
                    setIsCorrectNetwork(false);
                    // Hesap bağlantısı kesildiğinde localStorage'ı temizle
                    localStorage.removeItem('connectedAccount');
                }
                setIsInitializing(false);
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('chainChanged');
                window.ethereum.removeAllListeners('accountsChanged');
            }
        };
    }, []);

    // İnitializing durumunda warning gösterme
    if (isInitializing) {
        return (
            <Router>
                <Layout
                    account={account}
                    onConnect={handleConnect}
                    isCorrectNetwork={true}
                >
                    <Routes>
                        <Route path="/" element={<Home account={account} />} />
                        <Route path="/my-tickets" element={<MyTickets />} />
                    </Routes>
                </Layout>
            </Router>
        );
    }

    return (
        <Router>
            <Layout
                account={account}
                onConnect={handleConnect}
                isCorrectNetwork={isCorrectNetwork}
            >
                <Routes>
                    <Route path="/" element={<Home account={account} />} />
                    <Route path="/my-tickets" element={<MyTickets />} />
                    <Route path="/create-lottery" element={<CreateLottery />} />
                    <Route path="/contract-manager" element={<ContractManager />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
