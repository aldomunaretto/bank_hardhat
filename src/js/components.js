"use strict";

/**
 * Actions
 */
function Actions(props) {

    const [depositVal, setDepositVal] = React.useState("0");
    const [withdrawVal, setWithdrawVal] = React.useState("0");

    async function deposit(e) {

        e.preventDefault();

        const wallet = props.wallet;

        console.log("Depositing... " + depositVal + " at " + wallet);

        await BANK.methods.deposit().send({
            from: wallet,
            value: web3.utils.toWei(depositVal, 'ether')
        });

        if (props.refresh) {
            props.refresh(wallet);
        }
    }

    async function withdraw(e) {

        e.preventDefault();

        const wallet = props.wallet;

        console.log("Withdrawing... " + withdrawVal + " at " + wallet);

        await BANK.methods.withdraw(web3.utils.toWei(withdrawVal, 'ether')).send({
            from: wallet
        });

        if (props.refresh) {
            props.refresh(wallet);
        }
    }

    const actionsStyle = {
        "marginTop": "16px",
        "display": "flex",
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center"
    };

    const actionStyle = {
        "flex": "1",
        "display": "flex",
        "flexDirection": "column",
        "border": "1px solid",
        "margin": "8px 0",
        "minWidth": "380px"
    };

    return (
        <div style={actionsStyle}>

            <div style={actionStyle}>
                <h2>Deposit Process</h2>
                <input type="number" name="depositVal" value={depositVal}
                    onChange={e => setDepositVal(e.target.value)} />
                <button onClick={deposit}> Deposit </button>
            </div>

            <div style={actionStyle}>
                <h2>Withdraw Process</h2>
                <input type="number" name="withdrawVal" value={withdrawVal}
                    onChange={e => setWithdrawVal(e.target.value)} />
                <button onClick={withdraw}> Withdraw </button>
            </div>

        </div>
    );
}

/**
 * Main
 */
function Main(props) {

    const [wallet, setWallet] = React.useState("");
    const [ethBalance, setEthBalance] = React.useState("");
    const [bankBalance, setBankBalance] = React.useState("");

    async function refreshBalances(wallet) {

        // Get Your balance

        const balanceVal = await web3.eth.getBalance(wallet);
        setEthBalance(web3.utils.fromWei(balanceVal, 'ether'));

        // Get Your bank balance

        const bankBalanceVal = await BANK.methods.getBalance().call({ from: wallet });
        setBankBalance(web3.utils.fromWei(bankBalanceVal, 'ether'));
    }

    async function connectToMetamask(e) {

        e.preventDefault();

        // Connect

        const wallets = await METAMASK.request({
            method: 'eth_requestAccounts'
        });

        // Network

        await METAMASK.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK]
        });

        // Refresh

        const wallet = wallets.length > 0 ? wallets[0] : null;
        setWallet(wallet);

        await refreshBalances(wallet);
    }

    return (
        <div>

            <img src="https://keepcoding.io/wp-content/uploads/2022/01/cropped-logo-keepcoding-Tech-School.png"></img>
            <h1>Welcome to Keepcoding Bank</h1>

            {
                wallet ?

                    <section>
                        <p><b>Wallet</b> = {wallet}</p>
                        <p><b>Wallet Balance</b> = {ethBalance} ETH</p>
                        <p><b>Bank Balance</b> = {bankBalance} ETH</p>
                        <Actions wallet={wallet} refresh={refreshBalances} />
                    </section>

                    :

                    <section>
                        <p>Welcome to your bank! It is time to connect your wallet.</p>
                        <button onClick={connectToMetamask}> Connect to Metamask </button>
                    </section>
            }

        </div>
    );
}