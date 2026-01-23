# DeFi Staking Dapp 🚀

A comprehensive DeFi staking platform with governance tokens, multi-tier time-locked staking, dual reward distribution, and advanced features.

## 🌟 Key Features

### Smart Contracts
- **Time-Locked Staking Tiers**
  - Flexible (1x multiplier) - No lock period
  - 30 Days (1.5x multiplier) - 15% APY
  - 60 Days (2x multiplier) - 20% APY
  - 90 Days (3x multiplier) - 30% APY

- **Dual Reward System**
  - Earn STK tokens (primary staking rewards)
  - Earn GOV tokens (10% bonus as governance tokens)

- **Dynamic APY**
  - Low TVL (<100K): 20% bonus multiplier
  - Medium TVL (100K-500K): 10% bonus multiplier
  - High TVL (>500K): Base rate

- **Auto-Compounding**
  - Optional automatic reward reinvestment
  - Compounds every 7 days
  - Maximize yield through compound interest

- **LP Token Staking**
  - Stake Uniswap V2 LP tokens (STK-ETH pairs)
  - Same reward mechanism as single token staking

- **Security Features**
  - ReentrancyGuard protection
  - Anti-flash loan (same-block prevention)
  - Anti-whale limits (1M max per wallet)
  - Pausable for emergencies
  - Emergency withdraw function

### Frontend (React + Vite)
- Modern glassmorphism UI
- MetaMask wallet integration
- Real-time reward tracking
- Staking tier selector
- LP staking interface
- Governance dashboard
- Auto-compound toggle
- Transaction history
- Responsive design

## 📁 Project Structure

```
DeFi-Staking-Dapp/
├── contracts/
│   ├── StakingToken.sol           # ERC20 staking token (STK)
│   ├── GovernanceToken.sol        # ERC20 governance token (GOV)
│   └── DeFiStakingContract.sol    # Main staking contract
├── scripts/
│   └── deploy.js                   # Deployment script
├── test/
│   └── DeFiStaking.test.js        # Comprehensive test suite
├── frontend-react/                 # React frontend (Vite)
├── hardhat.config.js              # Hardhat configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ and npm
- MetaMask browser extension
- Sepolia testnet ETH (for deployment)
- Infura or Alchemy RPC endpoint

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd "c:\Users\sures\Documents\EtherAuthority\Week-3\DeFi-Staking-Dapp"
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   PRIVATE_KEY=your_wallet_private_key
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Deployment

1. **Compile contracts:**
   ```bash
   npm run compile
   ```

2. **Run tests:**
   ```bash
   npm test
   ```
   
   Results: ✅ 24 tests passing

3. **Deploy to Sepolia:**
   ```bash
   npm run deploy:sepolia
   ```
   
   This will:
   - Deploy STK token (10M initial supply)
   - Deploy GOV token (1M initial supply)
   - Deploy DeFi staking contract
   - Fund contract with 5M STK rewards
   - Save addresses to `deployments/sepolia.json`

### Running the Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Open http://localhost:5173

## 🔬 Smart Contract Details

### Reward Calculation Formula

```solidity
Base Reward = (stakedAmount × 1000 × timeStaked) / (10000 × SECONDS_PER_YEAR)

Lock Multiplier Applied:
- Flexible: 1x (10% APY)
- 30 Days: 1.5x (15% APY)
- 60 Days: 2x (20% APY)
- 90 Days: 3x (30% APY)

TVL Bonus Applied:
- Low TVL: 1.2x
- Medium TVL: 1.1x
- High TVL: 1x

Final Reward = Base Reward × Lock Multiplier × TVL Bonus
GOV Reward = Final Reward × 0.1 (10% as governance tokens)
```

### Example Calculations

**Scenario 1: Flexible Staking**
- Stake: 10,000 STK
- Duration: 1 year
- Lock: Flexible (1x)
- TVL: Low (<100K) = 1.2x bonus
- **Result**: 1,200 STK + 120 GOV (12% effective APY)

**Scenario 2: 90-Day Lock**
- Stake: 10,000 STK
- Duration: 1 year
- Lock: 90 days (3x)
- TVL: Low (<100K) = 1.2x bonus
- **Result**: 3,600 STK + 360 GOV (36% effective APY!)

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

**Test Coverage:**
- ✅ Deployment verification
- ✅ Flexible staking
- ✅ Time-locked tiers (30/60/90 days)
- ✅ Reward calculations with multipliers
- ✅ Dual reward distribution (STK + GOV)
- ✅ Auto-compounding mechanism
- ✅ Dynamic TVL-based APY
- ✅ Anti-flash loan protection
- ✅ Emergency functions
- ✅ Pause/unpause functionality

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| Base APY | 10% |
| Max APY (90-day lock + low TVL) | 36% |
| GOV Token Bonus | 10% of STK rewards |
| Auto-Compound Interval | 7 days |
| Max Stake Per Wallet | 1,000,000 STK |
| STK Total Supply | 10,000,000 |
| GOV Max Supply | 10,000,000 |

## 🔒 Security Features

1. **ReentrancyGuard** - Prevents reentrancy attacks on all state-changing functions
2. **Anti-Flash Loan** - Blocks stake/unstake in the same block
3. **Anti-Whale Protection** - 1M STK maximum stake per wallet
4. **Pausable** - Owner can pause staking in emergencies
5. **Emergency Withdraw** - Users can recover stake without rewards if needed
6. **SafeERC20** - Safe token transfer operations

## 📝 Contract Addresses (Sepolia)

Live on Sepolia testnet!

```json
{
  "contracts": {
    "StakingToken": "0xd91c39aa7E372C60B02C4FA851cd605950F4483a",
    "GovernanceToken": "0xBa887e8b132A9828eaadB570597cd0916DABE28D",
    "DeFiStakingContract": "0x05bea5d9aBc8768E96126AaE69F461321b641225",
    "LPToken": "0x0000000000000000000000000000000000000000"
  }
}
```


## 🎨 Frontend Features

- **Dashboard**: Real-time stats (TVL, APY, your stake, rewards)
- **Staking Panel**: Choose tier and stake tokens
- **LP Staking**: Provide liquidity and stake LP tokens
- **Governance**: View GOV balance and voting power
- **Auto-Compound**: Toggle automatic reward reinvestment
- **Transaction History**: View all staking activities
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Technology Stack

**Blockchain:**
- Solidity 0.8.20
- Hardhat 2.22.0
- OpenZeppelin Contracts 5.0.0
- Ethers.js 6.x

**Frontend:**
- React 18
- Vite
- Web3Modal / RainbowKit
- Ethers.js
- Modern CSS3

## 🤝 Contributing

This is a training project for EtherAuthority Week 3.

## 📄 License

MIT License

## 🎓 Learning Objectives

This project demonstrates:
- ✅ Advanced DeFi mechanics (time locks, multipliers, dual rewards)
- ✅ Governance token implementation
- ✅ Liquidity pool token staking
- ✅ Dynamic APY calculations
- ✅ Auto-compounding strategies
- ✅ Smart contract security best practices
- ✅ Full-stack Web3 development
- ✅ Comprehensive testing

---

**Built with ❤️ for EtherAuthority Training - Week 3**
