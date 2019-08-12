const Web3 = require("web3");
const ZetherVerifier = require("../contract-artifacts/artifacts/ZetherVerifier.json");
const BurnVerifier = require("../contract-artifacts/artifacts/BurnVerifier.json");
const CashToken = require("../contract-artifacts/artifacts/CashToken.json");
const ZSC = require("../contract-artifacts/artifacts/ZSC.json");

const ethTx = require('ethereumjs-tx')

// constant and not important since we are running in PoA chain
const gasPrice = 1000;
const gasLimit = 470000000;

class Deployer {
    constructor() {
        const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:18545"))
        web3.transactionConfirmationBlocks = 1;

        // Deploys smart contract using signed rawTransactions
        this.deployContract = (addrFrom, privkey, contractRaw, a) => {
            const abi = contractRaw.abi;
            const bytecode = contractRaw.bytecode;
            const contract = new web3.eth.Contract(abi);
            let args = a ? a : [];

            return web3.eth.getTransactionCount(addrFrom).then(txCount => {
                const txObj = {
                    nonce: web3.utils.toHex(txCount),
                    gasPrice: web3.utils.toHex(gasPrice),
                    gasLimit: web3.utils.toHex(gasLimit),
                    data: bytecode,
                    arguments: args,
                }
                // sign the transaction with private key
                let tx = new ethTx(txObj);
                tx.sign(Buffer.from(privkey, "hex"));

                // serialize transaction
                let rawTx = "0x" + tx.serialize().toString("hex");

                 return new Promise((resolve, reject) => {
                     web3.eth.sendSignedTransaction(rawTx)
                        .on("receipt", (receipt) => {resolve(receipt)})
                        .on("error", (err) => {reject(err)})
                 });
            });
        };

        this.mintCashToken = (addrFrom, privKey, contractRaw, contractAddr, amount) => {
            const abi = contractRaw.abi;
            const ercContract = new web3.eth.Contract(abi, contractAddr);
            const amountEther = web3.utils.numberToHex(web3.utils.toWei(amount.toString(10), "ether"))
            const callData = ercContract.methods.mint(addrFrom, amountEther).encodeABI();

            return web3.eth.getTransactionCount(addrFrom).then(txCount => {
                const txObj = {
                    nonce: web3.utils.toHex(txCount),
                    gasPrice: web3.utils.toHex(gasPrice),
                    gasLimit: web3.utils.toHex(gasLimit),
                    to: contractAddr,
                    from: addrFrom,
                    data: callData,
                }
                // sign the transaction with private key
                let tx = new ethTx(txObj);
                tx.sign(Buffer.from(privKey, "hex"));

                // serialize transaction
                let rawTx = "0x" + tx.serialize().toString("hex");

                //send signed raw transaction
                return new Promise((resolve, reject) => {
                    web3.eth.sendSignedTransaction(rawTx)
                        .on('receipt', receipt => {resolve(receipt)})
                        .on("error", err => {reject(err)})
                });
            });
        }

        this.approveCashToken = (addrFrom, privKey, contractRaw, contractAddr, zscAddress, amountToApprove) => {
            const abi = contractRaw.abi;
            const ercContract = new web3.eth.Contract(abi, contractAddr);
            const callData = ercContract.methods.approve(zscAddress, amountToApprove).encodeABI();

            return web3.eth.getTransactionCount(addrFrom).then(txCount => {
                const txObj = {
                    nonce: web3.utils.toHex(txCount),
                    gasPrice: web3.utils.toHex(gasPrice),
                    gasLimit: web3.utils.toHex(gasLimit),
                    to: contractAddr,
                    from: addrFrom,
                    data: callData,
                }
                // sign the transaction with private key
                let tx = new ethTx(txObj);
                tx.sign(Buffer.from(privKey, "hex"));

                // serialize transaction
                let rawTx = "0x" + tx.serialize().toString("hex");

                //send signed raw transaction
                return new Promise((resolve, reject) => {
                    web3.eth.sendSignedTransaction(rawTx)
                        .on('receipt', receipt => {resolve(receipt)})
                        .on("error", err => {reject(err)})
                });
            });
        };
    }
}

module.exports = Deployer;
