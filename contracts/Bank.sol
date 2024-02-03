// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Bank {
    address admin;
    uint256 private annualInterestRate = 5; // 5% interest

    struct Interest {
        uint256 interestGiven;
        uint256 lastInterestTime;
    }

    mapping(address => uint256) private balances;
    mapping(address => Interest) private interests;

    constructor() {
        admin = tx.origin;
    }

    // Eventos para depósitos y retiros
    event Deposited(address indexed depositor, uint256 amount);
    event Withdrawn(address indexed withdrawal, uint256 amount);


    function getMyBalance() public view returns (uint256) {
        // calculateInterest();
        return balances[msg.sender];
    }

    function getUserBalance(address user) public view returns (uint256) {
        require(msg.sender == admin, "UNAUTHORIZED");
        return balances[user];
    }

    function deposit() public payable {
        require(msg.value > 0, "MIN_ETHER_NOT_MET");
        if(interests[msg.sender].lastInterestTime == 0) {
            interests[msg.sender].lastInterestTime = block.timestamp;
        } else {
            calculateInterest();
        }
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public {
        calculateInterest();
        require(balances[msg.sender] >= amount, "INSUFFICIENT_BALANCE");
        payable(msg.sender).transfer(amount);
        balances[msg.sender] -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    function calculateInterest() internal {
        uint256 timeElapsed = block.timestamp - interests[msg.sender].lastInterestTime;
        uint256 interest = balances[msg.sender] * (annualInterestRate / 100) * (timeElapsed / 60*60*24*365 days);
        balances[msg.sender] += interest;
        interests[msg.sender].interestGiven += interest;
        interests[msg.sender].lastInterestTime = block.timestamp;
    }

    function getUserInterest(address user) public view returns (uint256) {
        require(msg.sender == admin, "UNAUTHORIZED");
        return interests[user].interestGiven;
    }

    function getUserLastInterestPaid(address user) public view returns (uint256) {
        require(msg.sender == admin, "UNAUTHORIZED");
        return interests[user].lastInterestTime;
    }

    // Almacenaremos una variable que indique el porcentaje de interés que el banco aplica, y que podrá ser modificada por el owner del despliegue.
    function getannualInterestRate() public view returns (uint256) {
        return annualInterestRate;
    }

    // Crear una función que permita modificar la tasa de interes
    function setannualInterestRate(uint256 rate) public {
        require(msg.sender == admin, "UNAUTHORIZED");
        annualInterestRate = rate;
    }

}
