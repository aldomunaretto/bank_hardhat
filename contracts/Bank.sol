// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Bank {
    address owner;
    uint256 private annualInterestRate = 5; // 5% interest

    struct Interest {
        uint256 interestGiven;
        uint256 lastInterestTime;
    }

    mapping(address => uint256) private balances;
    mapping(address => Interest) private interests;
    mapping(address => bool) public admins;

    constructor() {
        owner = tx.origin;
        admins[tx.origin] = true;
    }

    event Deposited(address indexed depositor, uint256 amount);
    event Withdrawn(address indexed withdrawal, uint256 amount);
    event InterestPaid(address indexed user, uint256 amount);

    modifier onlyAdmin {
        require(admins[msg.sender], "UNAUTHORIZED");
        _;
    }

    function addAdmin(address user) public onlyAdmin {
        admins[user] = true;
    }

    function removeAdmin(address user) public onlyAdmin {
        require(msg.sender != user, "CANNOT_REMOVE_SELF");
        require(owner != user, "CANNOT_REMOVE_OWNER");
        admins[user] = false;
    }

    function getMyBalance() public view returns (uint256) {
        uint256 interest = estimateInterest(msg.sender);
        return balances[msg.sender] + interest;
    }

    function getUserBalance(address user) public view onlyAdmin returns (uint256) {
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

    function getUserInterest(address user) public view onlyAdmin returns (uint256) {
        return interests[user].interestGiven;
    }

    function getUserLastInterestPaid(address user) public view onlyAdmin returns (uint256) {
        return interests[user].lastInterestTime;
    }

     function getannualInterestRate() public view returns (uint256) {
        return annualInterestRate;
    }

    function setannualInterestRate(uint256 rate) public onlyAdmin {
        annualInterestRate = rate;
    }

}
