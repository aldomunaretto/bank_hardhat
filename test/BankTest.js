const { assert, expect } = require('chai');

describe("Nuestro Banco", function () {

    before(async function () {

        this.Bank = await ethers.getContractFactory("Bank");

        const [owner, addr1, addr2] = await ethers.getSigners();

        this.owner = owner;
        this.account1 = addr1;
        this.account2 = addr2;
    });

    beforeEach(async function () {

        this.bank = await this.Bank.deploy();
    });

    it("Is Deployed", async function () {

        assert.isTrue(this.bank !== undefined);
    });

    it("Owner can add more admins", async function () {

        await this.bank.connect(this.owner).addAdmin(this.account1);

        let isAdmin = await this.bank.admins(this.account1);
        assert.equal(isAdmin, true, "Admin was not added correctly");

    });

    it("Admins can add more admins", async function () {

        await this.bank.connect(this.owner).addAdmin(this.account1);

        let isAdmin1 = await this.bank.admins(this.account1);
        assert.equal(isAdmin1, true, "Admin was not added correctly");

        await this.bank.connect(this.account1).addAdmin(this.account2);

        let isAdmin2 = await this.bank.admins(this.account2);
        assert.equal(isAdmin2, true, "Admin was not added correctly");
    });

    it("Non-admins cannot add more admins", async function () { 

        await expect(this.bank.connect(this.account1).addAdmin(this.account2))
            .to.be.revertedWith("UNAUTHORIZED");
    });

    it("Admins can remove other admins", async function () {

        await this.bank.connect(this.owner).addAdmin(this.account1);

        let isAdmin1 = await this.bank.admins(this.account1);
        assert.equal(isAdmin1, true, "Admin was not added correctly");

        await this.bank.connect(this.owner).addAdmin(this.account2);

        let isAdmin2 = await this.bank.admins(this.account2);
        assert.equal(isAdmin2, true, "Admin was not added correctly");

        await this.bank.connect(this.account1).removeAdmin(this.account2);

        let stillAdmin = await this.bank.admins(this.account2);
        assert.equal(stillAdmin, false, "Admin was removed correctly");
    });

    it("Admins cannot remove owner", async function () { 

        await this.bank.connect(this.owner).addAdmin(this.account1);

        let isAdmin1 = await this.bank.admins(this.account1);
        assert.equal(isAdmin1, true, "Admin was not added correctly");

        await expect(this.bank.connect(this.account1).removeAdmin(this.owner))
            .to.be.revertedWith("CANNOT_REMOVE_OWNER");
    });

    it("Admins cannot remove themselves", async function () { 

        await this.bank.connect(this.owner).addAdmin(this.account1);

        let isAdmin1 = await this.bank.admins(this.account1);
        assert.equal(isAdmin1, true, "Admin was not added correctly");

        await expect(this.bank.connect(this.account1).removeAdmin(this.account1))
            .to.be.revertedWith("CANNOT_REMOVE_SELF");
    });

    it("Non-admins cannot remove admins", async function () { 

        await expect(this.bank.connect(this.account1).removeAdmin(this.account2))
            .to.be.revertedWith("UNAUTHORIZED");
    });

    it("Get My Balance works ok", async function () {

        let myBalance1 = await this.bank.connect(this.owner).getMyBalance();
        assert.equal(myBalance1.toString(), "0", "Invalid Balance");

        let myBalance2 = await this.bank.connect(this.account1).getMyBalance();
        assert.equal(myBalance2.toString(), "0", "Invalid Balance");
    });

    it("Get Any User Balance works ok", async function () {

        let userBalance1 = await this.bank.connect(this.owner).getUserBalance(this.account1);
        assert.equal(userBalance1.toString(), "0", "Invalid Balance");

        await expect(this.bank.connect(this.account1).getUserBalance(this.account2))
            .to.be.revertedWith("UNAUTHORIZED");
    });

    it("Deposit fails on value = 0", async function () {

        await expect(this.bank.connect(this.account1).deposit({ value: 0 }))
            .to.be.revertedWith("MIN_ETHER_NOT_MET");
    });

    it("Deposit succeed on value >= 0. Even consecutive ones.", async function () {

        let userBalance = await this.bank.connect(this.owner).getUserBalance(this.account1);
        assert.equal(userBalance.toString(), "0", "Invalid Balance");

        await this.bank.connect(this.account1).deposit({ value: 100 });

        userBalance = await this.bank.connect(this.owner).getUserBalance(this.account1);
        assert.equal(userBalance.toString(), "100", "Invalid Balance");

        await this.bank.connect(this.account1).deposit({ value: 100 });

        userBalance = await this.bank.connect(this.owner).getUserBalance(this.account1);
        assert.equal(userBalance.toString(), "200", "Invalid Balance");
    });

    it("Withdraw fails with no enough balance.", async function () {

        let userBalance = await this.bank.connect(this.owner).getUserBalance(this.account1);
        assert.equal(userBalance.toString(), "0", "Invalid Balance");

        await expect(this.bank.connect(this.account1).withdraw(100))
            .to.be.revertedWith("INSUFFICIENT_BALANCE");
    });

    it("Withdraw succeds.", async function () {

        let userBalance = await this.bank.connect(this.owner).getUserBalance(this.account1);
        assert.equal(userBalance.toString(), "0", "Invalid Balance");

        await this.bank.connect(this.account1).deposit({ value: 100 });

        userBalance = await this.bank.connect(this.owner).getUserBalance(this.account1);
        assert.equal(userBalance.toString(), "100", "Invalid Balance");

        await this.bank.connect(this.account1).withdraw(50);

        userBalance = await this.bank.connect(this.owner).getUserBalance(this.account1);
        assert.equal(userBalance.toString(), "50", "Invalid Balance");
    });

    it("Interest is calculated correctly", async function () {

        await this.bank.connect(this.account1).deposit({ value: ethers.parseEther("1")});

        await new Promise(resolve => setTimeout(resolve, 1000));

        await this.bank.connect(this.account1).deposit({ value: ethers.parseEther("1")});

        let interest = await this.bank.connect(this.owner).getUserInterest(this.account1);
        assert(interest > 1585489500, "Interest is not calculated correctly");
    });

    it("Get My Interest works correctly", async function () {

        await this.bank.connect(this.account1).deposit({ value: ethers.parseEther("1") });
    
        await new Promise(resolve => setTimeout(resolve, 1000));
    
        await this.bank.connect(this.account1).deposit({ value: ethers.parseEther("1") });
    
        let interest = await this.bank.connect(this.account1).getMyInterest();
        assert(interest > 1585489500, "Interest is not calculated correctly");
    });

    it("Timestamp for last interest paid is set correctly", async function () {

        await this.bank.connect(this.account1).deposit({ value: 10 });

        let timestamp = await this.bank.connect(this.owner).getUserLastInterestPaid(this.account1);
        assert(timestamp > 0, "timestamp is not set correctly");
    });

    it("Timestamp difference is calculated correctly", async function () {

        await this.bank.connect(this.account1).deposit({ value: 10 });

        let timestamp1 = await this.bank.connect(this.owner).getUserLastInterestPaid(this.account1);

        await new Promise(resolve => setTimeout(resolve, 1000));

        await this.bank.connect(this.account1).deposit({ value: 10 });

        let timestamp2 = await this.bank.connect(this.owner).getUserLastInterestPaid(this.account1);
        assert((timestamp2-timestamp1) >= 1, "timestamp difference is not calculated correctly");
    });

    it("Annual interest rate can be set by admin", async function () {

        await this.bank.connect(this.owner).setannualInterestRate(10);

        let annualRate = await this.bank.getannualInterestRate();
        assert.equal(annualRate.toString(), "10", "interest rate is not set correctly");
    });

    it("Annual interest rate cannot be set by non-admin", async function () {

        await expect(this.bank.connect(this.account1).setannualInterestRate(10))
            .to.be.revertedWith("UNAUTHORIZED");
    });

});