// Contract addresses from deployed contracts
export const CONTRACTS = {
  STAKING_CONTRACT: import.meta.env.VITE_STAKING_CONTRACT_ADDRESS || "0x0373422a7d54Eecf3e8a6c8e295d5b96b801982A",
  STK_TOKEN: import.meta.env.VITE_STK_TOKEN_ADDRESS || "0x17794627a2a04c8B642CC28B249419FDc85DE73b",
  GOV_TOKEN: import.meta.env.VITE_GOV_TOKEN_ADDRESS || "0xae1F11a9F7316A2A6D84d936F53e7ca9778F8410",
  LP_TOKEN: import.meta.env.VITE_LP_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000"
};

export const NETWORK = {
  chainId: "0xaa36a7", //  Sepolia testnet
  chainIdDecimal: 11155111,
  chainName: "Sepolia Test Network",
  rpcUrl: "https://sepolia.infura.io/v3/",
  blockExplorer: "https://sepolia.etherscan.io"
};

export const LOCK_PERIODS = {
  FLEXIBLE: { value: 0, name: "Flexible", multiplier: "1x", apy: "10%", duration: "No lock" },
  DAYS_30: { value: 1, name: "30 Days", multiplier: "1.5x", apy: "15%", duration: "30 days" },
  DAYS_60: { value: 2, name: "60 Days", multiplier: "2x", apy: "20%", duration: "60 days" },
  DAYS_90: { value: 3, name: "90 Days", multiplier: "3x", apy: "30%", duration: "90 days" }
};
