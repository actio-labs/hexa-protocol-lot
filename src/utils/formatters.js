export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const formatAmount = (amount, decimals = 18) => {
  // ... amount formatting logic
}; 