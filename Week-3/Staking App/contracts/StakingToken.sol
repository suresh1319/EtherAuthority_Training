// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakingToken
 * @dev ERC20 token that can be staked in the StakingContract
 */
contract StakingToken is ERC20, Ownable {
    
    constructor(uint256 initialSupply) ERC20("Staking Token", "STK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Mint new tokens (for testing purposes)
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Decimals set to 18 (default)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
