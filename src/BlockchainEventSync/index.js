const { ethers } = require("ethers");
const { connectRedis, redis } = require("../config/connectDb");
const { notifyRoundClose } = require("../config/socket");
const { CONTRACT_ADDRESS } = require("../constant");
const Info = require("../models/Info");
const PrizePool = require("../models/PricePool");
const { delay } = require("../utils");
const listenToEvents = require("./services/blockchain");
const pollEvents = require("./services/polling");
const { contract, provider, signer, signerPub, contractPub, providerPub
} = require("./services/provider");

const ROUND_INTERVAL = 120; // Time interval to check for round completion
const WAIT_INTERVAL = 400; // Delay between each iteration in milliseconds
const POST_ROUND_DELAY = 5000; // Delay after closing a round
const FETCH_ETH_PRICE = 60000// Delay 1 minute
const TX_TIMEOUT = 15000;
let SignedTransaction = null;

const getnonce = async () => {
  try {
    let nonce;
    nonce = await signerPub.getTransactionCount('latest');
    //console.log("nonce from pub", nonce);
    if (!nonce) {
      nonce = await signer.getTransactionCount('latest')
      //console.log("nonce from priv", nonce);
    }
    return nonce;
  } catch (error) {
    console.log("error in getting nonce", error);
    let nonce = await signer.getTransactionCount('latest');
    console.log("nonce from priv catch", nonce);
    return nonce;
  }
}

const getgasprice = async () => {
  try {
    let gasprice;
    gasprice = await providerPub.getGasPrice();
    //console.log("gasprice from pub", gasprice);
    if (!gasprice) {
      gasprice = await provider.getGasPrice();
      //console.log("gasprice from priv", gasprice);
    }
    return gasprice;
  } catch (error) {
    console.log("error in getting gasprice", error);
    let gasprice = await provider.getGasPrice();
    console.log("gasprice from priv catch", gasprice);
    return gasprice;
  }
}

const createrawtx = async () => {
  try {
    const txData = contract.interface.encodeFunctionData("closeRound");

    const nonce = await getnonce();
    // const estimatedGasLimit = await contract.estimateGas.closeRound() || await contractPub.estimateGas.closeRound();
    // const halfestimatedGasLimit = estimatedGasLimit.div(2);
    // const increasedGasLimit = estimatedGasLimit.add(halfestimatedGasLimit);

    const gasprice = await getgasprice();
    const halfGasprice = gasprice.div(2);
    const increasedGasPrice = gasprice.add(halfGasprice);

    const tx = {
      to: CONTRACT_ADDRESS,
      data: txData,
      gasPrice: increasedGasPrice || ethers.utils.parseUnits('45', 'gwei'),
      gasLimit: 300000,
      nonce: nonce,
      chainId: 137
    };

    const signedTx = await signer.signTransaction(tx);
    console.log("signTransaction", signedTx);
    return signedTx;
  } catch (error) {
    console.log("error in signing transaction: ", error);
    return null;
  }

}

const waitForConfirmation = async (tx, timeout) => {
  return Promise.race([
    tx.wait(1),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Transaction confirmation timeout")), timeout))
  ]);
}

const contractCall = async () => {
  while (true) {
    try {
      await delay(WAIT_INTERVAL); // Control the frequency of execution

      const start = await contract.roundstart();
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const isRoundFinish = (Number(start) + ROUND_INTERVAL) < currentTime;

      // const isRoundFinish = await contract.isRoundFinish();
      if (((Number(start) + ROUND_INTERVAL - 20) < currentTime) && !SignedTransaction) {
        SignedTransaction = await createrawtx();
      }

      // console.log('Start:', Number(start));
      console.log("Round finished:", isRoundFinish);

      if (isRoundFinish) {

        notifyRoundClose(); // Notify that the round has closed
        const roundNumber = await contract.roundNumber();
        const finish = await contract.isRoundFinish();
        const previousRoundNo = await redis.get('previousRoundNo');

        //console.log('roundNumber?.toString()', roundNumber?.toString());
        //console.log('previousRoundNo', previousRoundNo)

        if (finish && roundNumber?.toString() !== previousRoundNo) {
          //const gas = await contract.estimateGas.closeRound();
          //console.log('gas', gas?.toNumber())
          //const round = await contract.roundNumber();
          //console.log("round", round);
          // Update the prize pool state in the database
          await PrizePool.findOneAndUpdate(
            { round: Number(roundNumber) },
            { isRunning: false }
          );

          // Send transaction to close the round
          // const tx = await relayer.sendTransaction({
          //   to: CONTRACT_ADDRESS,
          //   value: '0x00',
          //   data: contract.interface.encodeFunctionData('closeRound', []),
          //   speed: 'safeLow',
          //   gasLimit: 10000000,
          // });

          // const receipt = await provider.waitForTransaction(tx.hash);
          //const gasprice = await provider.getGasPrice();

          let receipt;
          let failure = false;
          if (SignedTransaction) {
            try {
              const txPrivate = provider.sendTransaction(SignedTransaction);
              const txPublic = providerPub.sendTransaction(SignedTransaction);
              const tx = await Promise.any([txPrivate, txPublic]);
              console.log("txFromSignedtx", tx);
              // receipt = await tx.wait(1);
              receipt = await waitForConfirmation(tx, TX_TIMEOUT);
            } catch (error) {
              failure = true;
              console.log("error in sign transaction sending", error);
            }

          }

          if (!SignedTransaction || failure) {
            const gasprice = await provider.getGasPrice();
            const halfGasprice = gasprice.div(2);
            const gPrice = gasprice.add(halfGasprice)
            let noncelatest = await signer.getTransactionCount('latest');
            const tx = await contract.closeRound({ gasPrice: gPrice || ethers.utils.parseUnits('45', 'gwei'), nonce: noncelatest });
            console.log("txPrivate", tx);
            // receipt = await tx.wait(1);
            receipt = await waitForConfirmation(tx, TX_TIMEOUT);
          }


          await redis.set("previousRoundNo", roundNumber?.toString());
          SignedTransaction = null;
          console.log('Transaction receipt:', receipt);
        }
      }
    } catch (err) {
      SignedTransaction = null;
      console.error("Error in contract call loop:", err);
      await delay(WAIT_INTERVAL); // Ensure delay after an error to prevent immediate retry
    }
  }
};

const init = async () => {
  try {
    await connectRedis();

    syncincing = true;
    const [miniR, megaR, superR] = await Promise.all([
      contract.MINI_BONUS_ROUND_FREQUENCY(),
      contract.MEGA_BONUS_ROUND_FREQUENCY(),
      contract.SUPER_BONUS_ROUND_FREQUENCY(),
    ])

    const info = await Info.findOne({
      key: 'key'
    })

    if (info) {
      info.miniBonusRoundFriquvency = Number(miniR);
      info.megaBonusRoundFriquvency = Number(megaR);
      info.superBonusRoundFriquvency = Number(superR);
      info.nextMiniBonusRound = info.nextMiniBonusRound ? info?.nextMiniBonusRound : Number(miniR);
      info.nextMegaBonusRound = info.nextMegaBonusRound ? info?.nextMegaBonusRound : Number(megaR);
      info.nextSuperBonusRound = info.nextSuperBonusRound ? info?.nextSuperBonusRound : Number(superR);
      await info.save();
    } else {
      await Info.create({
        key: 'key',
        miniBonusRoundFriquvency: Number(miniR),
        megaBonusRoundFriquvency: Number(megaR),
        superBonusRoundFriquvency: Number(superR),
        nextMiniBonusRound: Number(miniR),
        nextMegaBonusRound: Number(megaR),
        nextSuperBonusRound: Number(superR),
      })
    }
  } catch (err) {
    console.log('err', err)
  }

}

const MaticToUsdPrice = async () => {
  while (true) {
    await delay(60000)
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
      const data = await response.json();
      let maticPrice = data["matic-network"]?.usd
      await redis.set('maticPrice', maticPrice);
    } catch (error) {
      console.error('Error fetching Ethereum price:', error);
    }
  }
}




const startListining = async () => {
  await init();
  listenToEvents();
  contractCall();
  MaticToUsdPrice()
  pollEvents();

}

module.exports = { startListining }