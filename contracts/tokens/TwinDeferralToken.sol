// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// Example Deferral ERC20 Token
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TwinDeferral is ERC20, Ownable {
    // Constructor initializes token name, symbol, initial supply, initial token pool, and token request limit
    constructor(uint256 initialSupply) ERC20("TwinDeferral", "TDEF") {
        _mint(msg.sender, initialSupply);
    }

    // Function to mint new tokens to a specified address
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Function to burn tokens from a specified address
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}
