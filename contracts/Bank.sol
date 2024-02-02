// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Bank {
    address admin;
    mapping(address => uint256) balances;

    constructor() {
        admin = tx.origin;
    }

    function getMyBalance() public view returns (uint256) {
        return balances[msg.sender];
    }

    function getUserBalance(address user) public view returns (uint256) {
        require(msg.sender == admin, "UNAUTHORIZED");
        return balances[user];
    }

    function deposit() public payable {
        require(msg.value > 0, "MIN_ETHER_NOT_MET");
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "INSUFFICIENT_BALANCE");
        payable(msg.sender).transfer(amount);
        balances[msg.sender] -= amount;
    }
}
