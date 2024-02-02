async function main() {

    console.log("Starting the sandbox...");

    const BankContract = await ethers.getContractFactory("Bank");
    const Bank = await BankContract.deploy();

    const [owner] = await ethers.getSigners();

    console.log("My Address is: " + owner.address);

    console.log("My Balance = " + ethers.formatEther(await Bank.getBalance()));
    await Bank.connect(owner).deposit({ value: ethers.parseUnits("0.1", "ether") });
    console.log("My Balance = " + ethers.formatEther(await Bank.getBalance()));
    await Bank.connect(owner).withdraw(ethers.parseUnits("0.1", "ether"));
    console.log("My Balance = " + ethers.formatEther(await Bank.getBalance()));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


