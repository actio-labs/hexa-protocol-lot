import React, { useState } from 'react';
import { ethers } from 'ethers';
import tokenList from '../contracts/erc20info.json';
import LotteryContractABI from '../contracts/LotteryContract.json';

function CreateLottery() {
    const [formData, setFormData] = useState({
        ticketTokenAddress: '',
        ticketPrice: '',
        serviceFee: '',
        participantLimit: ''
    });
    const [loading, setLoading] = useState(false);

    const CONTRACT_ADDRESS = "0x22EE4e85FC622Dc55B63F5cf268Cfe8d6Ff5F3aE";

    // Form değişikliklerini handle et
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Lottery oluştur
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                LotteryContractABI.abi,
                signer
            );

            // Form verilerini kontrat için hazırla
            const ticketPrice = ethers.parseEther(formData.ticketPrice);
            const serviceFee = Number(formData.serviceFee);
            const participantLimit = Number(formData.participantLimit);

            // Kontrat çağrısı
            const tx = await contract.startNewLottery(
                formData.ticketTokenAddress,
                ticketPrice,
                serviceFee,
                participantLimit
            );

            await tx.wait();
            alert("Lottery created successfully!");
            
            // Formu sıfırla
            setFormData({
                ticketTokenAddress: '',
                ticketPrice: '',
                serviceFee: '',
                participantLimit: ''
            });

        } catch (error) {
            console.error("Error creating lottery:", error);
            alert("Failed to create lottery: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-lottery-container">
            <h1>Create New Lottery</h1>
            
            <form onSubmit={handleSubmit} className="create-lottery-form">
                <div className="form-group">
                    <label>Token:</label>
                    <select 
                        name="ticketTokenAddress"
                        value={formData.ticketTokenAddress}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Token</option>
                        {tokenList.data.map((token) => (
                            <option key={token.address} value={token.address}>
                                {token.name} ({token.symbol})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Ticket Price:</label>
                    <input
                        type="number"
                        name="ticketPrice"
                        value={formData.ticketPrice}
                        onChange={handleChange}
                        placeholder="Enter ticket price"
                        step="0.000000000000000001"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Service Fee (%):</label>
                    <input
                        type="number"
                        name="serviceFee"
                        value={formData.serviceFee}
                        onChange={handleChange}
                        placeholder="Enter service fee percentage"
                        min="0"
                        max="100"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Participant Limit:</label>
                    <input
                        type="number"
                        name="participantLimit"
                        value={formData.participantLimit}
                        onChange={handleChange}
                        placeholder="Enter participant limit"
                        min="2"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className="create-button"
                    disabled={loading}
                >
                    {loading ? "Creating..." : "Create Lottery"}
                </button>
            </form>
        </div>
    );
}

export default CreateLottery; 