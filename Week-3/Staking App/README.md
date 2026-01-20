# Staking Dapp - Earn 10% APY 💎

A full-stack decentralized staking application built with Solidity smart contracts, Node.js backend, and modern Web3 frontend.

## 🌟 Features

### Smart Contracts
- **ERC20 Staking Token** with minting capability  
- **Staking Contract** with 10% APY rewards
- Flexible staking (no lock period)
- Real-time reward calculation
- Emergency withdraw function
- Pause/unpause functionality
- ReentrancyGuard protection

### Backend API
- Express.js REST API
- MongoDB integration for transaction history
- Web3 blockchain integration
- Automatic event listeners
- Contract address management
- User statistics and analytics

### Frontend
- Modern dark theme UI with glassmorphism effects
- MetaMask wallet integration
- Real-time rewards display
- Stake/Unstake interface
- Transaction history
- Responsive design
- Toast notifications
- Loading states

## 📁 Project Structure

```
Staking App/
├── contracts/                  # Smart contracts
│   ├── StakingToken.sol       # ERC20 token contract
│   └── StakingContract.sol    # Main staking contract
├── scripts/                    # Deployment scripts
│   └── deploy.js              # Deploy to blockchain
├── test/                       # Contract tests
│   └── Staking.test.js        # Comprehensive test suite
├── backend/                    # Backend API
│   ├── server.js              # Express server
│   ├── models/                # MongoDB models
│   │   └── Stake.js           # Stake transaction model
│   ├── routes/                # API routes
│   │   └── staking.js         # Staking endpoints
│   └── services/              # Business logic
│       └── blockchain.js      # Web3 integration
├── frontend/                   # Frontend application
│   ├── index.html             # Main HTML file
│   ├── index.css              # Styles
│   └── app.js                 # Web3 application logic
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Root dependencies
└── .env.example               # Environment variables template

```

## 🚀 Getting Started

### Prerequisites

- Node.js v16+ and npm
- MongoDB (local or cloud)
- MetaMask browser extension
- Sepolia testnet ETH (for deployment)
- Infura or Alchemy RPC endpoint (for Sepolia)

### Installation

1. **Clone and navigate to project:**
   ```bash
   cd "c:/Users/sures/Documents/EtherAuthority/Week-3/Staking App"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```env
   PRIVATE_KEY=your_wallet_private_key
   INFURA_API_KEY=your_infura_api_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   MONGODB_URI=mongodb://localhost:27017/staking-app
   PORT=3000
   ```

### Deployment

1. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```

2. **Run tests:**
   ```bash
   npx hardhat test
   ```

3. **Deploy to Sepolia:**
   ```bash
   npm run deploy
   ```
   
   This will:
   - Deploy StakingToken with 1M initial supply
   - Deploy StakingContract
   - Fund contract with 500K tokens for rewards
   - Save contract addresses to `deployments/sepolia.json`
   - Verify contracts on Etherscan

### Running the Application

1. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

2. **Start backend server:**
   ```bash
   cd backend
   npm start
   ```
   
   Server will run on http://localhost:3000

3. **Open frontend:**
   - Open `frontend/index.html` in your browser
   - Or use a local server:
     ```bash
     cd frontend
     npx serve
     ```

4. **Connect MetaMask:**
   - Switch to Sepolia testnet
   - Click "Connect Wallet"
   - Approve connection

## 📖 Usage Guide

### For Users

1. **Get Test Tokens:**
   - After deployment, the deployer has the initial token supply
   - Transfer some STK tokens to your wallet for testing

2. **Staking Flow:**
   - Enter amount to stake
   - Click "1. Approve Tokens" (first time only)
   - Click "2. Stake Tokens"
   - Confirm transaction in MetaMask

3. **Claiming Rewards:**
   - Rewards accrue automatically based on time staked
   - Click "💎 Claim Rewards" to claim without unstaking
   - Rewards appear in your wallet balance

4. **Unstaking:**
   - Enter amount to unstake
   - Click "Unstake Tokens"
   - Receive staked amount + pending rewards

### API Endpoints

**Get User Staking Data:**
```
GET /api/user/:address
```

**Get All Stakes:**
```
GET /api/stakes?page=1&limit=20
```

**Get Statistics:**
```
GET /api/stats
```

**Get Contract Addresses:**
```
GET /api/contracts?network=sepolia
```

**Record Transactions:**
```
POST /api/stake
POST /api/unstake
POST /api/claim
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npx hardhat test
```

Tests cover:
- Staking functionality
- Reward calculations (10% APY)
- Unstaking and withdrawals
- Claim rewards
- Emergency withdraw
- Pause functionality
- Access controls

## 📊 Reward Calculation

The contract implements a 10% APY reward mechanism:

```solidity
Rewards = (stakedAmount * 1000 * timeStaked) / (10000 * SECONDS_PER_YEAR)
```

Where:
- `1000` = 10% in basis points
- `10000` = basis points denominator
- `SECONDS_PER_YEAR` = 365 days in seconds

Example: Staking 1000 tokens for 1 year = 100 tokens reward (10%)

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Owner can pause staking in emergencies
- **SafeERC20**: Safe token transfers
- **Ownable**: Access control for admin functions
- **Emergency Withdraw**: Users can withdraw without rewards if needed

## 🎨 Design Highlights

- Modern dark theme with vibrant gradients
- Glassmorphism UI effects
- Smooth animations and transitions
- Fully responsive design
- Real-time data updates
- Toast notifications for user feedback
- Loading states for transactions

## 🛠️ Technology Stack

**Blockchain:**
- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts
- Ethers.js

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Web3.js v4
- CORS enabled

**Frontend:**
- Vanilla JavaScript
- Web3.js
- MetaMask integration
- Modern CSS3

## 📝 Environment Variables

```env
# Blockchain
PRIVATE_KEY=              # Deployer wallet private key
INFURA_API_KEY=          # Infura project API key
ETHERSCAN_API_KEY=       # Etherscan API key for verification
SEPOLIA_RPC_URL=         # Sepolia RPC endpoint

# Backend
MONGODB_URI=             # MongoDB connection string
PORT=3000                # Backend server port
NETWORK=sepolia          # Network name
```

## 🚨 Important Notes

- This is a testnet deployment for learning purposes
- Never share your private keys
- Always test on testnet before mainnet
- Ensure sufficient ETH for gas fees
- Backend must be running for transaction history

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

This is a training project. Feel free to fork and modify for your own learning!

## 📞 Support

For issues:
1. Check contract is deployed: `deployments/sepolia.json` exists
2. Verify backend is running: http://localhost:3000/health
3. Ensure MetaMask is on Sepolia network
4. Check browser console for errors

---

**Built with ❤️ for EtherAuthority Training - Week 3**
