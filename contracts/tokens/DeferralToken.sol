// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Deferral {
    string public constant symbol = "DEF";
    string public constant name = "Deferral";
    uint8 public constant decimals = 18;
    uint256 public totalSupply = 100000000000000000000;

    mapping(address => uint256) public balances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event SupplyIncreased(uint256 value);

    address public owner;

    constructor() public {
        owner = msg.sender;
        balances[owner] = totalSupply;
    }

    function transfer(address to, uint256 value) public {
        require(balances[msg.sender] >= value, "Insufficient balance.");
        balances[msg.sender] -= value;
        balances[to] += value;
        emit Transfer(msg.sender, to, value);
    }

    function balanceOf(address owner) public view returns (uint256) {
        return balances[owner];
    }

    function increaseSupply(uint256 value) public {
        require(msg.sender == owner, "Only the owner can increase the supply.");
        totalSupply += value;
        balances[owner] += value;
        emit SupplyIncreased(value);
    }
}
