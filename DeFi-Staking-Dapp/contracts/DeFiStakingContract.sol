// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./GovernanceToken.sol";

/**
 * @title DeFiStakingContract V2
 * @dev Enhanced staking contract with MULTIPLE STAKES support:
 * - Time-locked tiers (Flexible, 30d, 60d, 90d) with multipliers
 * - Dual rewards (STK + GOV tokens)
 * - LP token staking support
 * - Dynamic APY based on TVL
 * - Auto-compounding mechanism
 * - Anti-whale protection
 * - Multiple independent stakes per user
 */
contract DeFiStakingContract is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    // Token contracts
    IERC20 public stakingToken;      // STK token
    IERC20 public lpToken;           // Uniswap V2 LP token (STK-ETH)
    GovernanceToken public govToken; // GOV governance token
    
    // Time lock periods
    enum LockPeriod { FLEXIBLE, DAYS_30, DAYS_60, DAYS_90 }
    
    // Staking information
    struct Stake {
        uint256 amount;              // Amount staked
        uint256 timestamp;           // Last update timestamp
        uint256 rewardDebt;          // Rewards already claimed
        LockPeriod lockPeriod;       // Selected lock period
        uint256 unlockTime;          // When tokens can be unstaked
        bool isLPStake;              // True if staking LP tokens
        bool autoCompound;           // Auto-compound rewards
        uint256 lastCompoundTime;    // Last auto-compound timestamp
        uint256 govRewardsEarned;    // Total GOV tokens earned
        uint256 lastActionBlock;     // Anti-flash loan protection
        bool active;                 // Whether this stake is active
    }
    
    // User stakes - now supports multiple stakes per user
    mapping(address => Stake[]) public userStakes;
    
    // Protocol statistics
    uint256 public totalStaked;           // Total STK staked
    uint256 public totalLPStaked;         // Total LP tokens staked
    uint256 public totalRewardsPaid;      // Total STK rewards paid
    uint256 public totalGovRewardsPaid;   // Total GOV rewards paid
    
    // Configuration
    uint256 public constant BASE_APY = 1000;           // 10% base APY
    uint256 public constant BASIS_POINTS = 10000;      // Denominator for percentages
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant GOV_REWARD_RATIO = 1000;   // 10% of STK rewards as GOV
    uint256 public constant MAX_STAKE_PER_WALLET = 1_000_000 * 10**18; // Anti-whale: 1M max
    uint256 public constant AUTO_COMPOUND_INTERVAL = 7 days;
    uint256 public constant MAX_STAKES_PER_USER = 50;  // Prevent array bloat
    
    // TVL thresholds for dynamic APY
    uint256 public constant LOW_TVL_THRESHOLD = 100_000 * 10**18;   // <100K
    uint256 public constant HIGH_TVL_THRESHOLD = 500_000 * 10**18;  // >500K
    
    // Events
    event Staked(address indexed user, uint256 stakeId, uint256 amount, LockPeriod lockPeriod, bool isLP);
    event Unstaked(address indexed user, uint256 stakeId, uint256 amount, uint256 stkRewards, uint256 govRewards);
    event RewardsClaimed(address indexed user, uint256 stakeId, uint256 stkRewards, uint256 govRewards);
    event AutoCompounded(address indexed user, uint256 stakeId, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 stakeId, uint256 amount);
    
    constructor(
        address _stakingToken,
        address _lpToken,
        address _govToken
    ) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_lpToken != address(0), "Invalid LP token");
        require(_govToken != address(0), "Invalid gov token");
        
        stakingToken = IERC20(_stakingToken);
        lpToken = IERC20(_lpToken);
        govToken = GovernanceToken(_govToken);
    }
    
    /**
     * @dev Get multiplier based on lock period
     * @param lockPeriod The selected lock period
     * @return Multiplier in basis points (10000 = 1x)
     */
    function getLockMultiplier(LockPeriod lockPeriod) public pure returns (uint256) {
        if (lockPeriod == LockPeriod.FLEXIBLE) return 10000;  // 1x
        if (lockPeriod == LockPeriod.DAYS_30) return 15000;   // 1.5x
        if (lockPeriod == LockPeriod.DAYS_60) return 20000;   // 2x
        if (lockPeriod == LockPeriod.DAYS_90) return 30000;   // 3x
        return 10000;
    }
    
    /**
     * @dev Get TVL bonus multiplier based on total value locked
     * @return Bonus multiplier in basis points
     */
    function getTVLBonus() public view returns (uint256) {
        uint256 tvl = totalStaked + totalLPStaked;
        
        if (tvl < LOW_TVL_THRESHOLD) return 12000;      // 1.2x (20% bonus)
        if (tvl < HIGH_TVL_THRESHOLD) return 11000;     // 1.1x (10% bonus)
        return 10000;                                   // 1x (no bonus)
    }
    
    /**
     * @dev Get lock duration in seconds
     */
    function getLockDuration(LockPeriod lockPeriod) public pure returns (uint256) {
        if (lockPeriod == LockPeriod.FLEXIBLE) return 0;
        if (lockPeriod == LockPeriod.DAYS_30) return 30 days;
        if (lockPeriod == LockPeriod.DAYS_60) return 60 days;
        if (lockPeriod == LockPeriod.DAYS_90) return 90 days;
        return 0;
    }
    
    /**
     * @dev Get total staked amount for a user across all stakes
     */
    function getTotalUserStake(address user) public view returns (uint256) {
        Stake[] storage stakes = userStakes[user];
        uint256 total = 0;
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].active) {
                total += stakes[i].amount;
            }
        }
        return total;
    }
    
    /**
     * @dev Get number of active stakes for a user
     */
    function getStakeCount(address user) public view returns (uint256) {
        Stake[] storage stakes = userStakes[user];
        uint256 count = 0;
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].active) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Stake tokens - creates a NEW independent stake
     * @param amount Amount to stake
     * @param lockPeriod Selected lock period
     * @param isLP Whether staking LP tokens
     * @param enableAutoCompound Enable auto-compounding
     */
    function stake(
        uint256 amount,
        LockPeriod lockPeriod,
        bool isLP,
        bool enableAutoCompound
    ) external nonReentrant whenNotPaused returns (uint256 stakeId) {
        require(amount > 0, "Cannot stake 0");
        
        // Check max stakes limit
        require(userStakes[msg.sender].length < MAX_STAKES_PER_USER, "Max stakes reached");
        
        // Anti-whale protection - check total across all stakes
        require(getTotalUserStake(msg.sender) + amount <= MAX_STAKE_PER_WALLET, "Exceeds max stake");
        
        // Transfer tokens
        if (isLP) {
            lpToken.safeTransferFrom(msg.sender, address(this), amount);
            totalLPStaked += amount;
        } else {
            stakingToken.safeTransferFrom(msg.sender, address(this), amount);
            totalStaked += amount;
        }
        
        // Create new stake
        Stake memory newStake = Stake({
            amount: amount,
            timestamp: block.timestamp,
            rewardDebt: 0,
            lockPeriod: lockPeriod,
            unlockTime: block.timestamp + getLockDuration(lockPeriod),
            isLPStake: isLP,
            autoCompound: enableAutoCompound,
            lastCompoundTime: block.timestamp,
            govRewardsEarned: 0,
            lastActionBlock: block.number,
            active: true
        });
        
        userStakes[msg.sender].push(newStake);
        stakeId = userStakes[msg.sender].length - 1;
        
        emit Staked(msg.sender, stakeId, amount, lockPeriod, isLP);
        return stakeId;
    }
    
    /**
     * @dev Unstake tokens from a specific stake and claim all rewards
     * @param stakeId Index of the stake to unstake
     * @param amount Amount to unstake (0 = unstake all)
     */
    function unstake(uint256 stakeId, uint256 amount) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        
        Stake storage userStake = userStakes[msg.sender][stakeId];
        require(userStake.active, "Stake not active");
        
        // If amount is 0, unstake everything
        if (amount == 0) {
            amount = userStake.amount;
        }
        
        require(userStake.amount >= amount, "Insufficient stake");
        require(amount > 0, "Cannot unstake 0");
        
        // Anti-flash loan protection
        require(userStake.lastActionBlock != block.number, "Same block action");
        
        // Check if lock period has passed
        if (userStake.lockPeriod != LockPeriod.FLEXIBLE) {
            require(block.timestamp >= userStake.unlockTime, "Tokens still locked");
        }
        
        // Auto-compound if enabled and due
        if (userStake.autoCompound) {
            _tryAutoCompound(msg.sender, stakeId);
        }
        
        // Calculate pending rewards
        (uint256 stkRewards, uint256 govRewards) = calculateRewards(msg.sender, stakeId);
        
        // Update stake
        userStake.amount -= amount;
        if (userStake.amount == 0) {
            userStake.active = false;
        } else {
            userStake.timestamp = block.timestamp;
            userStake.rewardDebt = 0;
        }
        
        // Update totals
        if (userStake.isLPStake) {
            totalLPStaked -= amount;
        } else {
            totalStaked -= amount;
        }
        
        userStake.lastActionBlock = block.number;
        
        // Transfer staked tokens back
        if (userStake.isLPStake) {
            lpToken.safeTransfer(msg.sender, amount);
        } else {
            stakingToken.safeTransfer(msg.sender, amount);
        }
        
        // Transfer STK rewards
        if (stkRewards > 0) {
            totalRewardsPaid += stkRewards;
            stakingToken.safeTransfer(msg.sender, stkRewards);
        }
        
        // Mint GOV rewards
        if (govRewards > 0) {
            totalGovRewardsPaid += govRewards;
            govToken.mint(msg.sender, govRewards);
        }
        
        emit Unstaked(msg.sender, stakeId, amount, stkRewards, govRewards);
    }
    
    /**
     * @dev Claim rewards from a specific stake without unstaking
     */
    function claimRewards(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        _claimRewards(msg.sender, stakeId);
    }
    
    /**
     * @dev Claim rewards from all active stakes
     */
    function claimAllRewards() external nonReentrant {
        Stake[] storage stakes = userStakes[msg.sender];
        require(stakes.length > 0, "No stakes");
        
        uint256 totalStkRewards = 0;
        uint256 totalGovRewards = 0;
        
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].active && stakes[i].amount > 0) {
                (uint256 stkRewards, uint256 govRewards) = _claimRewards(msg.sender, i);
                totalStkRewards += stkRewards;
                totalGovRewards += govRewards;
            }
        }
        
        require(totalStkRewards > 0 || totalGovRewards > 0, "No rewards");
    }
    
    /**
     * @dev Internal function to claim rewards from a specific stake
     */
    function _claimRewards(address user, uint256 stakeId) internal returns (uint256 stkRewards, uint256 govRewards) {
        Stake storage userStake = userStakes[user][stakeId];
        require(userStake.active, "Stake not active");
        require(userStake.amount > 0, "No active stake");
        
        // Auto-compound if enabled and due
        if (userStake.autoCompound) {
            _tryAutoCompound(user, stakeId);
        }
        
        (stkRewards, govRewards) = calculateRewards(user, stakeId);
        require(stkRewards > 0 || govRewards > 0, "No rewards available");
        
        // Update stake
        userStake.timestamp = block.timestamp;
        userStake.rewardDebt = 0;
        userStake.govRewardsEarned += govRewards;
        
        // Transfer rewards
        if (stkRewards > 0) {
            totalRewardsPaid += stkRewards;
            stakingToken.safeTransfer(user, stkRewards);
        }
        
        if (govRewards > 0) {
            totalGovRewardsPaid += govRewards;
            govToken.mint(user, govRewards);
        }
        
        emit RewardsClaimed(user, stakeId, stkRewards, govRewards);
        return (stkRewards, govRewards);
    }
    
    /**
     * @dev Try to auto-compound rewards for a specific stake
     */
    function _tryAutoCompound(address user, uint256 stakeId) internal {
        Stake storage userStake = userStakes[user][stakeId];
        
        if (!userStake.autoCompound) return;
        if (block.timestamp < userStake.lastCompoundTime + AUTO_COMPOUND_INTERVAL) return;
        
        (uint256 stkRewards, ) = calculateRewards(user, stakeId);
        
        if (stkRewards > 0) {
            userStake.amount += stkRewards;
            userStake.timestamp = block.timestamp;
            userStake.lastCompoundTime = block.timestamp;
            userStake.rewardDebt = 0;
            
            totalRewardsPaid += stkRewards;
            totalStaked += stkRewards;
            
            emit AutoCompounded(user, stakeId, stkRewards);
        }
    }
    
    /**
     * @dev Calculate pending rewards for a specific stake
     * @param user Address of user
     * @param stakeId Index of the stake
     * @return stkRewards STK token rewards
     * @return govRewards GOV token rewards
     */
    function calculateRewards(address user, uint256 stakeId) public view returns (uint256 stkRewards, uint256 govRewards) {
        if (stakeId >= userStakes[user].length) {
            return (0, 0);
        }
        
        Stake memory userStake = userStakes[user][stakeId];
        
        if (!userStake.active || userStake.amount == 0) {
            return (0, 0);
        }
        
        uint256 timeStaked = block.timestamp - userStake.timestamp;
        
        // Base reward calculation: (amount * APY * time) / (basis points * year)
        uint256 baseReward = (userStake.amount * BASE_APY * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        // Apply lock period multiplier
        uint256 lockMultiplier = getLockMultiplier(userStake.lockPeriod);
        baseReward = (baseReward * lockMultiplier) / BASIS_POINTS;
        
        // Apply TVL bonus
        uint256 tvlBonus = getTVLBonus();
        stkRewards = (baseReward * tvlBonus) / BASIS_POINTS;
        
        // Calculate GOV rewards (10% of STK rewards value)
        govRewards = (stkRewards * GOV_REWARD_RATIO) / BASIS_POINTS;
        
        return (stkRewards, govRewards);
    }
    
    /**
     * @dev Get a specific stake
     */
    function getStake(address user, uint256 stakeId) external view returns (
        uint256 amount,
        uint256 timestamp,
        LockPeriod lockPeriod,
        uint256 unlockTime,
        bool isLPStake,
        bool autoCompound,
        bool active,
        uint256 pendingSTKRewards,
        uint256 pendingGOVRewards
    ) {
        require(stakeId < userStakes[user].length, "Invalid stake ID");
        
        Stake memory userStake = userStakes[user][stakeId];
        (uint256 stkRewards, uint256 govRewards) = calculateRewards(user, stakeId);
        
        return (
            userStake.amount,
            userStake.timestamp,
            userStake.lockPeriod,
            userStake.unlockTime,
            userStake.isLPStake,
            userStake.autoCompound,
            userStake.active,
            stkRewards,
            govRewards
        );
    }
    
    /**
     * @dev Get all stakes for a user
     */
    function getAllUserStakes(address user) external view returns (
        uint256[] memory amounts,
        uint256[] memory timestamps,
        uint256[] memory unlockTimes,
        LockPeriod[] memory lockPeriods,
        bool[] memory isLPStakes,
        bool[] memory autoCompounds,
        bool[] memory actives,
        uint256[] memory stkRewards,
        uint256[] memory govRewards
    ) {
        Stake[] storage stakes = userStakes[user];
        uint256 length = stakes.length;
        
        amounts = new uint256[](length);
        timestamps = new uint256[](length);
        unlockTimes = new uint256[](length);
        lockPeriods = new LockPeriod[](length);
        isLPStakes = new bool[](length);
        autoCompounds = new bool[](length);
        actives = new bool[](length);
        stkRewards = new uint256[](length);
        govRewards = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            amounts[i] = stakes[i].amount;
            timestamps[i] = stakes[i].timestamp;
            unlockTimes[i] = stakes[i].unlockTime;
            lockPeriods[i] = stakes[i].lockPeriod;
            isLPStakes[i] = stakes[i].isLPStake;
            autoCompounds[i] = stakes[i].autoCompound;
            actives[i] = stakes[i].active;
            (stkRewards[i], govRewards[i]) = calculateRewards(user, i);
        }
        
        return (amounts, timestamps, unlockTimes, lockPeriods, isLPStakes, autoCompounds, actives, stkRewards, govRewards);
    }
    
    /**
     * @dev Get user's complete staking information (aggregated)
     * @dev For backwards compatibility with old frontend
     */
    function getUserStake(address user) external view returns (
        uint256 stakedAmount,
        uint256 stakedTimestamp,
        uint256 pendingSTKRewards,
        uint256 pendingGOVRewards,
        LockPeriod lockPeriod,
        uint256 unlockTime,
        bool isLPStake,
        bool autoCompound,
        uint256 effectiveAPY
    ) {
        Stake[] storage stakes = userStakes[user];
        
        // Return data from first active stake for backwards compatibility
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].active) {
                (uint256 stkRewards, uint256 govRewards) = calculateRewards(user, i);
                
                // Calculate effective APY
                uint256 lockMultiplier = getLockMultiplier(stakes[i].lockPeriod);
                uint256 tvlBonus = getTVLBonus();
                effectiveAPY = (BASE_APY * lockMultiplier * tvlBonus) / (BASIS_POINTS * BASIS_POINTS);
                
                return (
                    stakes[i].amount,
                    stakes[i].timestamp,
                    stkRewards,
                    govRewards,
                    stakes[i].lockPeriod,
                    stakes[i].unlockTime,
                    stakes[i].isLPStake,
                    stakes[i].autoCompound,
                    effectiveAPY
                );
            }
        }
        
        // No active stakes
        return (0, 0, 0, 0, LockPeriod.FLEXIBLE, 0, false, false, BASE_APY);
    }
    
    /**
     * @dev Toggle auto-compound for a specific stake
     */
    function toggleAutoCompound(uint256 stakeId) external {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        
        Stake storage userStake = userStakes[msg.sender][stakeId];
        require(userStake.active, "Stake not active");
        require(userStake.amount > 0, "No active stake");
        
        userStake.autoCompound = !userStake.autoCompound;
    }
    
    /**
     * @dev Emergency withdraw - lose all rewards for a specific stake
     */
    function emergencyWithdraw(uint256 stakeId) external nonReentrant {
        require(stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        
        Stake storage userStake = userStakes[msg.sender][stakeId];
        require(userStake.active, "Stake not active");
        
        uint256 amount = userStake.amount;
        require(amount > 0, "No active stake");
        
        bool isLP = userStake.isLPStake;
        
        // Update totals
        if (isLP) {
            totalLPStaked -= amount;
            lpToken.safeTransfer(msg.sender, amount);
        } else {
            totalStaked -= amount;
            stakingToken.safeTransfer(msg.sender, amount);
        }
        
        userStake.active = false;
        userStake.amount = 0;
        
        emit EmergencyWithdraw(msg.sender, stakeId, amount);
    }
    
    /**
     * @dev Get total value locked (TVL)
     */
    function getTVL() external view returns (uint256) {
        return totalStaked + totalLPStaked;
    }
    
    /**
     * @dev Get current dynamic APY
     */
    function getCurrentAPY() external view returns (uint256) {
        uint256 tvlBonus = getTVLBonus();
        return (BASE_APY * tvlBonus) / BASIS_POINTS;
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
     * @dev Fund contract with reward tokens (only owner)
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
