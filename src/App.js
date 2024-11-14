import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import Layout from './components/Layout';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import CreateLottery from './pages/CreateLottery';
import ContractManager from './pages/ContractManager';

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
            const savedAccount = localStorage.getItem('connectedAccount');
            if (savedAccount) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    const isCorrect = await checkNetwork();
                    setIsCorrectNetwork(isCorrect);
                } else {
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

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                localStorage.setItem('connectedAccount', accounts[0]);
                const isCorrect = await checkNetwork();
                setIsCorrectNetwork(isCorrect);
            }
        } catch (error) {
            console.error('Failed to connect:', error);
            localStorage.removeItem('connectedAccount');
        }
    };

    useEffect(() => {
        checkWalletAndNetwork();

        if (window.ethereum) {
            window.ethereum.on('chainChanged', async (chainId) => {
                const isCorrect = chainId === TAIKO_HEKLA_CHAIN_ID;
                setIsCorrectNetwork(isCorrect);
            });

            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    localStorage.setItem('connectedAccount', accounts[0]);
                    checkNetwork().then(setIsCorrectNetwork);
                } else {
                    setAccount(null);
                    setIsCorrectNetwork(false);
                    localStorage.removeItem('connectedAccount');
                }
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('chainChanged');
                window.ethereum.removeAllListeners('accountsChanged');
            }
        };
    }, []);

    const routerBasename = process.env.NODE_ENV === 'production' ? '/hexa-protocol-lot' : '';

    return (
        <Router basename={routerBasename}>
            <Layout
                account={account}
                onConnect={handleConnect}
                isCorrectNetwork={isCorrectNetwork}
            >
                <Routes>
                    <Route path="/" element={<Home account={account} />} />
                    <Route path="/home" element={<Home account={account} />} />
                    <Route path="/my-tickets" element={<MyTickets />} />
                    <Route path="/create-lottery" element={<CreateLottery />} />
                    <Route path="/contract-manager" element={<ContractManager />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
