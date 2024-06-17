const { Relayer } = require("@openzeppelin/defender-relay-client");
const { DefenderRelayProvider, DefenderRelaySigner } = require("@openzeppelin/defender-relay-client/lib/ethers");
const { Contract, ethers } = require("ethers");
const { CONTRACT_ADDRESS, RPC_URL, RPC_URL_PUB } = require("../../constant");
const CONTRACTABI = require('../../abi/Contract.json');

// const credentials = { apiKey: process.env.OPENZEPPLIN_API_KEY, apiSecret: process.env.OPENZEPPLIN_SECERET_KEY };

// // console.log('credentials', credentials)
// const provider = new DefenderRelayProvider(credentials);
// // const provider = new ethers.providers.JsonRpcBatchProvider
// const signer = new DefenderRelaySigner(credentials, provider, { speed: 'safeLow' });

// const relayer = new Relayer(credentials);

// provider for private node
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATEKEY, provider);
const contract = new Contract(CONTRACT_ADDRESS, CONTRACTABI, signer);

//public node provider
const providerPub = new ethers.providers.JsonRpcProvider(RPC_URL_PUB);
const signerPub = new ethers.Wallet(process.env.PRIVATEKEY, providerPub);
const contractPub = new Contract(CONTRACT_ADDRESS, CONTRACTABI, signerPub);

module.exports = {
    // relayer,
    contract,
    provider,
    signer,
    contractPub,
    providerPub,
    signerPub
}