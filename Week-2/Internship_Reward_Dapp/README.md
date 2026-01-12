# Internship Reward Dapp

A modern Web3 decentralized application for managing internship programs with blockchain-based rewards.

## Features

- 🔗 **MetaMask Integration** - Connect your wallet
- 👥 **Intern Management** - Register and manage interns
- ✅ **Task Tracking** - Submit, review, and track tasks
- 🏆 **NFT Rewards** - Earn NFT certificates for achievements
- 📊 **Dashboard** - Overview of statistics and activities
- 👤 **Profile Management** - View intern profiles and performance

## Tech Stack

- **Frontend**: React 18 + Vite
- **Web3**: ethers.js for wallet connection
- **Styling**: Vanilla CSS with modern design system
- **APIs**: Integration with Intern Registration & Task Submission APIs

## Prerequisites

- Node.js (v14 or higher)
- MetaMask browser extension
- Running API servers:
  - Intern Registration API on port 3000
  - Task Submission API on port 3001

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173`

3. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

### Connect Wallet
1. Click "Connect Wallet" in the header
2. MetaMask will prompt you to connect
3. Your wallet address will be displayed

### Register Intern
1. Navigate to "Register" page
2. Fill out the intern registration form
3. Submit to create a new intern profile

### Manage Tasks
1. Go to "Tasks" page
2. Submit new tasks for interns
3. Review and score submitted tasks
4. Track task status and progress

### View NFT Gallery
1. Visit "NFT Gallery" to see earned NFT certificates
2. Each approved task generates an NFT
3. View achievement details and scores

### View Profile
1. Select an intern from the "Profile" page
2. View personal information, skills, and performance metrics
3. See complete task history

## API Integration

The dapp connects to two backend APIs:

- **Intern API**: `http://localhost:3000/api/interns`
- **Task API**: `http://localhost:3001/api/tasks`

Make sure both APIs are running before starting the dapp.

## Features Overview

### Dashboard
- Total interns count
- Total tasks count
- Completed tasks statistics
- Recent interns and tasks lists

### Intern Registration
- Name, email, phone
- Skills (comma-separated)
- Department selection
- Mentor assignment

### Task Management
- Submit tasks with title, description, due date
- Filter tasks by intern
- Review tasks with comments and scores
- Update task status (Pending → Submitted → Reviewed → Approved/Rejected)

### NFT Gallery
- Beautiful card-based layout
- Gradient designs for each NFT
- Achievement type badges
- Score display
- Statistics dashboard

### Profile
- View intern details
- Performance metrics (avg score, completion rate)
- Complete task history
- Skills showcase

## Design Features

- **Modern UI**: Glassmorphism effects, gradients, smooth animations
- **Dark Theme**: Professional dark color scheme
- **Responsive**: Works on desktop, tablet, and mobile
- **Fast**: Optimized with Vite for instant HMR
- **Accessible**: WCAG compliant design

## Future Enhancements

- Actual blockchain minting (Ethereum/Polygon)
- IPFS integration for NFT metadata
- Real-time notifications
- Advanced analytics and charts
- Multi-chain support
- NFT marketplace integration

## License

ISC
