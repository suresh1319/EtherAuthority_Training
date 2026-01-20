// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StakingContract
 * @dev Allows users to stake tokens and earn rewards based on time staked
 * Reward Rate: 10% APY (Annual Percentage Yield)
 */
contract StakingContract is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    IERC20 public stakingToken;
    
    // 10% APY = 10/365 = 0.0274% per day
    // Using basis points for precision: 10% = 1000 basis points
    // Reward = (amount * 1000 * timeStaked) / (10000 * 365 days)
    uint256 public constant REWARD_RATE = 1000; // 10% APY (1000 basis points / 10000 = 0.1 = 10%)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    struct Stake {
        uint256 amount;          // Amount of tokens staked
        uint256 timestamp;       // When the stake was created/updated
        uint256 rewardDebt;      // Rewards already claimed
    }
    
    mapping(address => Stake) public stakes;
    
    uint256 public totalStaked;
    uint256 public totalRewardsPaid;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);
    }
    
    /**
     * @dev Stake tokens
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0 tokens");
        
        Stake storage userStake = stakes[msg.sender];
        
        // If user already has a stake, claim pending rewards first
        if (userStake.amount > 0) {
            uint256 pending = calculateRewards(msg.sender);
            if (pending > 0) {
                userStake.rewardDebt += pending;
                stakingToken.safeTransfer(msg.sender, pending);
                totalRewardsPaid += pending;
                emit RewardsClaimed(msg.sender, pending, block.timestamp);
            }
        }
        
        // Transfer tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update stake
        userStake.amount += amount;
        userStake.timestamp = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Unstake tokens and claim rewards
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(amount > 0, "Cannot unstake 0 tokens");
        
        // Calculate and pay out pending rewards
        uint256 pending = calculateRewards(msg.sender);
        uint256 totalPayout = amount + pending;
        
        // Update stake
        userStake.amount -= amount;
        if (userStake.amount == 0) {
            delete stakes[msg.sender];
        } else {
            userStake.timestamp = block.timestamp;
            userStake.rewardDebt = 0;
        }
        
        totalStaked -= amount;
        
        if (pending > 0) {
            totalRewardsPaid += pending;
            emit RewardsClaimed(msg.sender, pending, block.timestamp);
        }
        
        // Transfer tokens back to user
        stakingToken.safeTransfer(msg.sender, totalPayout);
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Claim accumulated rewards without unstaking
     */
    function claimRewards() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No active stake");
        
        uint256 pending = calculateRewards(msg.sender);
        require(pending > 0, "No rewards available");
        
        // Update stake timestamp and reward debt
        userStake.timestamp = block.timestamp;
        userStake.rewardDebt = 0;
        totalRewardsPaid += pending;
        
        // Transfer rewards
        stakingToken.safeTransfer(msg.sender, pending);
        
        emit RewardsClaimed(msg.sender, pending, block.timestamp);
    }
    
    /**
     * @dev Calculate pending rewards for a user
     * @param user Address of the user
     * @return Pending reward amount
     */
    function calculateRewards(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];
        if (userStake.amount == 0) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - userStake.timestamp;
        
        // Reward = (stakedAmount * rewardRate * timeStaked) / (basisPoints * secondsPerYear)
        // Example: 1000 tokens staked for 1 year
        // = (1000 * 1000 * 31536000) / (10000 * 31536000) = 100 tokens (10%)
        uint256 rewards = (userStake.amount * REWARD_RATE * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return rewards;
    }
    
    /**
     * @dev Get user's staking information
     * @param user Address of the user
     */
    function getUserStake(address user) external view returns (
        uint256 stakedAmount,
        uint256 stakedTimestamp,
        uint256 pendingRewards,
        uint256 rewardsClaimed
    ) {
        Stake memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.timestamp,
            calculateRewards(user),
            userStake.rewardDebt
        );
    }
    
    /**
     * @dev Get total staked amount
     */
    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }
    
    /**
     * @dev Get APY in basis points
     */
    function getAPY() external pure returns (uint256) {
        return REWARD_RATE; // Returns 1000 (10%)
    }
    
    /**
     * @dev Emergency withdraw - withdraw staked tokens without rewards
     * Only use in case of emergency
     */
    function emergencyWithdraw() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        uint256 amount = userStake.amount;
        require(amount > 0, "No active stake");
        
        totalStaked -= amount;
        delete stakes[msg.sender];
        
        stakingToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    /**
     * @dev Pause staking (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause staking (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Fund the contract with reward tokens (only owner)
     * @param amount Amount of tokens to fund
     */
    function fundRewards(uint256 amount) external onlyOwner {
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return stakingToken.balanceOf(address(this));
    }
}
