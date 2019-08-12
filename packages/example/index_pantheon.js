const Web3 = require("web3");
const Client = require("../anonymous.js/src/client_pantheon.js");
const Deployer = require('./deployer_pantheon.js');
const Provider = require('./provider.js');

// Zether smart contracts 
const ZetherVerifier = require("../contract-artifacts/artifacts/ZetherVerifier.json");
const BurnVerifier = require("../contract-artifacts/artifacts/BurnVerifier.json");
const CashToken = require("../contract-artifacts/artifacts/CashToken.json");
const ZSC = require("../contract-artifacts/artifacts/ZSC.json");

(async () => {
    // bootstrap info
    const addrFrom = "fe3b557e8fb62b89f4916b721be55ceb828dbd73";
    const privKey = "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63"
    const providerEndpoint = "ws://0.0.0.0:18546"

    var provider = new Provider(providerEndpoint);
    const web3 = new Web3(await provider.getProvider());
    web3.transactionConfirmationBlocks = 1;
    var deployer = new Deployer();

    // deploy Zether verifier contract
    const zetherAddr = (await deployer.deployContract(addrFrom, privKey, ZetherVerifier)).contractAddress;
    console.log("Zether contract deployed: ", zetherAddr)

    // deploy Burn contract
    const burnAddr = (await deployer.deployContract(addrFrom, privKey, BurnVerifier)).contractAddress;
    console.log("Burn contract deployed: ", burnAddr)

    // deploy Cash contract
    const cashAddr = (await deployer.deployContract(addrFrom, privKey, CashToken)).contractAddress;
    console.log("Cash contract deployed: ", cashAddr)

    // balance before mint
    let balance = balanceMinted(addrFrom, cashAddr, CashToken, web3);
    balance.then(wei => console.log("balance: "+wei + " wei"));

    // add balance to Cash contract
    const etherFund = 10;
    let _ = await deployer.mintCashToken(addrFrom, privKey, CashToken, cashAddr, etherFund);
    console.log("ERC20 funds minted");

    // balance after mint
    balance = balanceMinted(addrFrom, cashAddr, CashToken, web3);
    balance.then(wei => console.log("balance: "+wei + " wei"));

    // deploy main ZSC contract
    const epochLength = 6; // in seconds
    let args = [cashAddr, zetherAddr, burnAddr, epochLength]
    const zscAddr = (await deployer.deployContract(addrFrom, privKey, ZSC, args)).contractAddress; // epoch length in seconds.
    console.log("ZSC contract deployed: ", zscAddr)

    // approved minted cash
    const _approvedReceipt = await deployer.approveCashToken(addrFrom, privKey, CashToken, cashAddr, zscAddr, etherFund);
    

    // Client side
    //
    //const accounts = await web3.eth.getAccounts();
    const deployed = new web3.eth.Contract(ZSC.abi, zscAddr);
    const account = addrFrom;

    const client = new Client(deployed, account, web3);
    //await client.initialize();
    
    // await client.deposit(10000);
    // await client.withdraw(1000);
    // client.friends.add("Alice", ['0x0eaadaaa84784811271240ec2f03b464015082426aa13a46a99a56c964a5c7cc', '0x173ce032ad098e9fcbf813696da92328257e58827f3600b259c42e52ff809433']);
    // await client.transfer('Alice', 1000);
})().catch(console.error);

// helpers
async function balanceMinted(fromAddr, contractAddr, contract, web3) {
    const abi = contract.abi;
    const ercContract = new web3.eth.Contract(abi, contractAddr);
    return ercContract.methods.balanceOf(fromAddr).call();
};