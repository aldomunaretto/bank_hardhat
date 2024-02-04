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

    event Deposited(address indexed depositor, uint256 amount);
    event Withdrawn(address indexed withdrawal, uint256 amount);
    event InterestPaid(address indexed user, uint256 amount);


    function getMyBalance() public view returns (uint256) {
        uint256 interest = estimateInterest(msg.sender);
        return balances[msg.sender] + interest;
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
            calculateInterest(msg.sender);
        }
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public {
        calculateInterest(msg.sender);
        require(balances[msg.sender] >= amount, "INSUFFICIENT_BALANCE");
        payable(msg.sender).transfer(amount);
        balances[msg.sender] -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    function calculateInterest(address user) internal {
        uint256 interest = estimateInterest(user);
        balances[user] += interest;
        interests[user].interestGiven += interest;
        interests[user].lastInterestTime = block.timestamp;
        emit InterestPaid(user, interest);
    }

    function estimateInterest(address user) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - interests[user].lastInterestTime;
        uint256 interest = balances[user] * annualInterestRate / 100 * timeElapsed / 365 days;
        return interest;
    }

    function getMyInterest() public view returns (uint256) {
        uint256 interest = estimateInterest(msg.sender);
        return interests[msg.sender].interestGiven + interest;
    }

    function getUserInterest(address user) public view returns (uint256) {
        require(msg.sender == admin, "UNAUTHORIZED");
        return interests[user].interestGiven;
    }

    function getUserLastInterestPaid(address user) public view returns (uint256) {
        require(msg.sender == admin, "UNAUTHORIZED");
        return interests[user].lastInterestTime;
    }

     function getannualInterestRate() public view returns (uint256) {
        return annualInterestRate;
    }

    function setannualInterestRate(uint256 rate) public {
        require(msg.sender == admin, "UNAUTHORIZED");
        annualInterestRate = rate;
    }

}
