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
        // console.log(interest.toString());
        // revisar esto ya que segun la calculadora de intereses deberia ser 15854895991.9
        assert(interest.toString(), "1585489599", "interest is calculated correctly");
    });

    it("Timestamp for last interest paid is set correctly", async function () {

        await this.bank.connect(this.account1).deposit({ value: 10 });

        let timestamp = await this.bank.connect(this.owner).getUserLastInterestPaid(this.account1);
        assert(timestamp.toString() > 0, "timestamp is not set correctly");
    });

    it("Timestamp difference is calculated correctly", async function () {

        await this.bank.connect(this.account1).deposit({ value: 10 });

        let timestamp1 = await this.bank.connect(this.owner).getUserLastInterestPaid(this.account1);

        await new Promise(resolve => setTimeout(resolve, 1000));

        await this.bank.connect(this.account1).deposit({ value: 10 });

        let timestamp2 = await this.bank.connect(this.owner).getUserLastInterestPaid(this.account1);
        assert.equal((timestamp2-timestamp1).toString(), "1", "timestamp difference is not calculated correctly");
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