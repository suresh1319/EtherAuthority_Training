# How to Fix Contract Address Errors

## Problem
Your `deployments/sepolia.json` file has placeholder addresses (`0x0000...`), causing:
- ❌ Frontend "Parameter decoding error"
- ❌ Backend 500 errors on `/api/user/...`

## Solution: Update with Your Actual Contract Addresses

### Method 1: Find Addresses on Etherscan (Quickest)

1. **Go to Sepolia Etherscan**: https://sepolia.etherscan.io
2. **Search for your wallet address**: `0x3a875e02c59c75296069df86709e6c1a6ff58268`
3. **Look for your recent transactions** - you should see:
   - A "Contract Creation" transaction for **StakingToken**
   - A "Contract Creation" transaction for **StakingContract**
4. **Click each transaction** to get the contract address

### Method 2: Deploy Contracts Using Hardhat Script

If you haven't deployed yet or want to redeploy:

```bash
# Make sure you have a .env file with your settings
npx hardhat run scripts/deploy.js --network sepolia
```

This will automatically create the `deployments/sepolia.json` file with correct addresses.

### Method 3: Manually Update the File

Once you have your contract addresses, update `deployments/sepolia.json`:

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "deployedAt": "2026-01-19T19:00:00.000Z",
  "contracts": {
    "StakingToken": "0xYOUR_STAKING_TOKEN_ADDRESS_HERE",
    "StakingContract": "0xYOUR_STAKING_CONTRACT_ADDRESS_HERE"
  },
  "deployer": "0x3a875e02c59c75296069df86709e6c1a6ff58268"
}
```

**Replace:**
- `0xYOUR_STAKING_TOKEN_ADDRESS_HERE` with the actual StakingToken contract address
- `0xYOUR_STAKING_CONTRACT_ADDRESS_HERE` with the actual StakingContract contract address

### After Updating:

1. **Restart the backend server**:
   ```bash
   # In the backend terminal, press Ctrl+C, then:
   npm run dev
   ```
   
   You should see:
   ```
   ✅ Blockchain service initialized
   📝 Staking Contract: 0x...
   ```

2. **Hard refresh your browser** (Ctrl+Shift+R)

---

## Need Help Finding Your Contract Addresses?

If you can't find them on Etherscan, please share:
1. One of your recent transaction hashes from the browser console
2. Or let me know if you want to deploy fresh contracts using the Hardhat script

The transaction hashes are visible in your console (e.g., `blockHash: '0xf9c063fab...'`)
