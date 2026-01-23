// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GovernanceToken
 * @dev Simple ERC20 token for DAO governance
 * Total Supply Cap: 10,000,000 tokens
 * Simplified version without ERC20Votes for compatibility
 */
contract GovernanceToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10M tokens
    
    // Address of the staking contract (only it can mint rewards)
    address public stakingContract;
    
    event StakingContractUpdated(address indexed newStakingContract);
    
    constructor() 
        ERC20("DeFi Governance Token", "GOV") 
        Ownable(msg.sender) 
    {
        // Mint initial supply to deployer for distribution
        _mint(msg.sender, 1_000_000 * 10**18); // 1M initial supply
    }
    
    /**
     * @dev Set the staking contract address (only owner)
     * @param _stakingContract Address of the DeFi staking contract
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid address");
        stakingContract = _stakingContract;
        emit StakingContractUpdated(_stakingContract);
    }
    
    /**
     * @dev Mint new tokens as staking rewards
     * @param to Address to receive tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
}
