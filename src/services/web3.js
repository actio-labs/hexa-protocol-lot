import { ethers } from 'ethers';
import { CHAIN_ID, RPC_URL } from '../config/constants';

export const getProvider = () => {
  return new ethers.JsonRpcProvider(RPC_URL);
};

export const checkNetwork = async () => {
  // ... network check logic
};

export const connectWallet = async () => {
  // ... wallet connection logic
}; 