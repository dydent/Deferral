// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// Example Deferral ERC20 Token
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Deferral is ERC20, Ownable {
    uint256 public tokenRequestLimit; // Maximum number of tokens a user can request
    uint256 public tokenPool; // Number of tokens available in the token pool for users to request

    // Constructor initializes token name, symbol, initial supply, initial token pool, and token request limit
    constructor(
        uint256 initialSupply,
        uint256 initialTokenPool,
        uint256 initialTokenRequestLimit
    ) ERC20("Deferral", "DEF") {
        require(
            initialTokenPool <= initialSupply,
            "Initial token pool cannot exceed initial supply."
        );
        _mint(msg.sender, initialSupply - initialTokenPool);
        tokenPool = initialTokenPool;
        tokenRequestLimit = initialTokenRequestLimit;
    }

    // Function to mint new tokens to a specified address
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Function to burn tokens from a specified address
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    // Function for users to request tokens up to the token request limit
    function requestTokens(uint256 amount) public {
        require(
            amount <= tokenRequestLimit,
            "Requested amount exceeds the token request limit."
        );
        require(amount <= tokenPool, "Insufficient tokens in the pool.");
        _transfer(address(this), msg.sender, amount);
        tokenPool -= amount;
    }

    // Function to update the token request limit
    function setTokenRequestLimit(uint256 newLimit) public onlyOwner {
        tokenRequestLimit = newLimit;
    }

    // Function to add tokens to the token pool
    function addToTokenPool(uint256 amount) public onlyOwner {
        _mint(address(this), amount);
        tokenPool += amount;
    }

    // Function to approve a spender to spend tokens from the contract's token pool
    function approveSpender(address spender, uint256 amount) public onlyOwner {
        require(amount <= tokenPool, "Insufficient tokens in the pool.");
        _approve(address(this), spender, amount);
    }
}
