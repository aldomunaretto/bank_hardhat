"use strict";

var METAMASK = null;
var BANK = null;
var NETWORK = null;

if (typeof window.ethereum == 'undefined') {

    console.error('MetaMask is not installed!');
    document.body.innerText = "MetaMask is not installed!"

} else {

    METAMASK = window.ethereum;

    const web3 = new window.Web3(METAMASK);

    const BANK_ADDRESS = {CONTRACT_ADDRESS};
    const BANK_ABI = {CONTRACT_ABI};

    BANK = new web3.eth.Contract(BANK_ABI, BANK_ADDRESS);

    NETWORK = {
        chainName: 'Hardhat',
        chainId: web3.utils.toHex(31337),
        nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' },
        rpcUrls: ['http://127.0.0.1:8545']
    }

    function MyApp() {
        return <div><Main /></div>;
    }

    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);

    root.render(<MyApp />);
}