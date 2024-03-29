"use strict";

/**
 * Actions
 */
function Actions(props) {

    const [depositVal, setDepositVal] = React.useState("0");
    const [withdrawVal, setWithdrawVal] = React.useState("0");
    const [annualInterestRateVal, setannualInterestRateVal] = React.useState("0");
    const [eventData, setEventData] = React.useState(null);
    // const [isAdmin, setIsAdmin] = React.useState(false);

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
            setDepositVal("0");
            setWithdrawVal("0");
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
            setDepositVal("0");
            setWithdrawVal("0");
        }
    }

    async function setannualInterestRate(e) {

        e.preventDefault();

        const wallet = props.wallet;

        console.log("Setting new annual interest rate: " + annualInterestRateVal + "%");

        await BANK.methods.setannualInterestRate(annualInterestRateVal).send({
            from: wallet
        });

        if (props.refresh) {
            props.refresh(wallet);
        }
    }

    async function getAnnualInterestRate() {
        const rate = await BANK.methods.getannualInterestRate().call();
        setannualInterestRateVal(rate);
    }
    
    React.useEffect(() => {
        getAnnualInterestRate();
    }, []);

    React.useEffect(() => {
        BANK.events.InterestPaid()
          .on('data', (event) => {
            console.log(event); // Log all data from the event
            setEventData(event);
          })
          .on('error', console.error);
      }, []);

        // async function checkIsAdmin(e) {
    
    
        //     const adminStatus = await BANK.methods.admins(window.ethereum.selectedAddress).call();
        //     setIsAdmin(adminStatus);
    
        //     await BANK.methods.setannualInterestRate(annualInterestRateVal).send({
        //         from: wallet
        //     });
    
        //     if (props.refresh) {
        //         props.refresh(wallet);
        //     }

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
        <div className="numbers" style={actionsStyle}>

            <div className="bank" style={actionStyle}>
                <h2><span>Deposit</span> Process</h2>
                <input id="number" type="number" name="depositVal" value={depositVal}
                    onChange={e => setDepositVal(e.target.value)} />
                <button onClick={deposit}> Deposit </button>
            </div>

            <div className="bank" style={actionStyle}>
                <h2><span>Withdraw</span> Process</h2>
                <input type="number" name="withdrawVal" value={withdrawVal}
                    onChange={e => setWithdrawVal(e.target.value)} />
                <button onClick={withdraw}> Withdraw </button>
            </div>

            {/* { window.ethereum.request({method: 'eth_accounts'})[0] === props.wallet && ( */}
                <div className="bank" style={actionStyle}>
                    <h2><span>Set </span> Annual Interest Rate</h2>
                    <input type="number" name="annualInterestRateVal" value={annualInterestRateVal}
                        onChange={e => setannualInterestRateVal(e.target.value)} />
                    <button onClick={setannualInterestRate}> Update Annual Interest Rate </button>
                </div>
            {/* )} */}

            <div>
      { eventData && (
            <div className="bank" style={actionStyle}>
                <h2><span>Event</span> Logs</h2>
                <p>{eventData ? JSON.stringify(eventData) : "No events yet"}</p>
            </div>
                  )}
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
    const [interestReceived, setinterestReceived] = React.useState("");

    async function refreshBalances(wallet) {

        // Get Your balance

        const balanceVal = await web3.eth.getBalance(wallet);
        setEthBalance(web3.utils.fromWei(balanceVal, 'ether'));

        // Get Your bank balance

        const bankBalanceVal = await BANK.methods.getMyBalance().call({ from: wallet });
        setBankBalance(web3.utils.fromWei(bankBalanceVal, 'ether'));

        // Get Your interest estimation

        const interestReceivedVal = await BANK.methods.getMyInterest().call({ from: wallet });
        setinterestReceived(web3.utils.fromWei(interestReceivedVal, 'ether'));
        console.log(interestReceivedVal);
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

    // Hook to refresh balances without updating the page.
    React.useEffect(() => {
        let interval;
        if (wallet) {
            refreshBalances(wallet);
            interval = setInterval(() => refreshBalances(wallet), 10000);
        }

        return () => clearInterval(interval);
    }, [wallet]);

    return (
        <div>

            <img src="./assets/logo.png" width="15%"></img>
            <h1>Welcome to Bit Bank</h1>

            {
                wallet ?

                    <section>
                        <p><b>Wallet</b> = {wallet}</p>
                        <p><b>Wallet Balance</b> = {ethBalance} ETH</p>
                        <p><b>Bank Balance</b> = {bankBalance} ETH</p>
                        <p><b>Interest Earned</b> = {interestReceived} ETH</p>
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