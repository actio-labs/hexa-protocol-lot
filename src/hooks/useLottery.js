import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLotteryContract } from '../services/web3';

export const useLottery = () => {
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(false);

  // ... lottery logic

  return { lotteries, loading, fetchLotteries, participateInLottery };
}; 