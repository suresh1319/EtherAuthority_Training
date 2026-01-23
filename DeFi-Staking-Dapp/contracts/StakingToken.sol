// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakingToken
 * @dev Simple ERC20 token for staking
 */
contract StakingToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Staking Token", "STK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
