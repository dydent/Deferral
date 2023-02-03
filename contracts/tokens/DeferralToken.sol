// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract DeferralToken is ERC20 {

    constructor(uint256 initialSupply) ERC20("Deferral", "DEF") {
        _mint(msg.sender, initialSupply);
    }
}
