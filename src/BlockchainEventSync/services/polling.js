const { contract } = require("./provider");
const PrizePool = require('../../models/PricePool');
const Info = require('../../models/Info');
const Stack = require('../../models/Stack');
const Hash = require('../../models/Hash');
const { DEPLOYED_BLOCK_NO } = require("../../constant");
const { redis } = require('../../config/connectDb');
const { provider } = require('./provider');
const { indexToHexColor, delay } = require("../../utils");
const { hashExist, newRoundAction, winnerSelectedAction, enteredAction, affiliatedAction } = require("./eventActions");
const { ethers } = require("ethers");
const History = require("../../models/History");




const newRound = async (fromBlock, toBlock) => {
	const eventFilter = contract.filters.NewRound();

	const events = await contract.queryFilter(eventFilter, fromBlock, toBlock);

	// Iterate through the events
	for (const event of events) {
		try {

			// const log = await hashExist(event)
			const transactionHash = event.transactionHash;

			// const log = await PrizePool.findOne({
			// 	transactionHash,
			// });

			// if (log) continue;

			const args = event.args;

			await newRoundAction({
				round: Number(args[0]),
				prize: Number(args[1]),
				start: Number(args[2]),
				isBonus: Number(args[3]),
				transactionHash: transactionHash
			})
		} catch (err) {
			console.log('err', err)
		}
	}
	events.forEach(async (event) => {
		console.log(`NewRound ${event.blockNumber}:`, event.args);
	});

};

const winnerSelected = async (fromBlock, toBlock) => {
	const eventFilter = contract.filters.WinnerSelected();

	const events = await contract.queryFilter(eventFilter, fromBlock, toBlock);
	console.log({
		fromBlock,
		toBlock,
	});

	for (const event of events) {
		// console.log('winnerSelectedEvent',await event?.getBlock()?.timestamp)

		try {
			// const log = await hashExist(event)
			const transactionHash = event.transactionHash;

			// const log = await History.findOne({
			// 	transactionHash,
			// });
			// if (log) continue;
			const args = event.args;
			const round = Number(args[0]);
			const user = args[1].toLowerCase();
			const prize = isFinite(Number(args[2])) ? ethers.utils.formatEther(args[2]) : 0;

			await winnerSelectedAction({
				round,
				user,
				prize,
				transactionHash,
				event
			})

		} catch (err) {
			console.log('err', err)
		}

	}
	// Iterate through the events
	// events.forEach((event) => {
	// 	console.log(`WinnerSelected ${event.blockNumber}:`, event.args);
	// });
};

const entered = async (fromBlock, toBlock) => {
	const eventFilter = contract.filters.Entered();

	const events = await contract.queryFilter(eventFilter, fromBlock, toBlock);

	// Iterate through the events
	for (const event of events) {
		// const log = await hashExist(event)
		// const log = await Stack.findOne({
		// 	transactionHash:event.transactionHash
		// });
		// if (log) continue;
		// console.log('log1612199Second', log)
		console.log(`Entered ${event.blockNumber}:`, event.transactionHash);
		const args = event.args;

		const round = Number(args[0]);
		const user = args[1].toLowerCase();
		const amount = ethers.utils.formatEther(args[2]);


		await enteredAction({
			round,
			user,
			amount,
			transactionHash: event.transactionHash
		})



	};
};

// user affiliator function

const affiliated = async (fromBlock, toBlock) => {
	const eventFilter = contract.filters.Affiliated();
	const events = await contract.queryFilter(eventFilter, fromBlock, toBlock);

	for (const event of events) {
		const args = event.args;

		const user = args[0].toLowerCase();
		const affilator = args[1].toLowerCase();

		await affiliatedAction({
			user,
			affilator
		})
	};
}

const pollEvents = async () => {
	let STARTBLOCK = DEPLOYED_BLOCK_NO;

	while (true) {
		try {
			await delay(1000)
			let blockNumber = await redis.get("blockNumber");

			if (!blockNumber) {
				await redis.set("blockNumber", STARTBLOCK);
				blockNumber = STARTBLOCK;
			}

			blockNumber = Number(blockNumber);
			const latestBlockNumber = await provider.getBlockNumber() - 3;

			if (blockNumber >= latestBlockNumber) continue;


			await Promise.all([
				winnerSelected(blockNumber, latestBlockNumber),
				entered(blockNumber, latestBlockNumber),
				newRound(blockNumber, latestBlockNumber),
				affiliated(blockNumber, latestBlockNumber),

			]);
			await redis.set("blockNumber", latestBlockNumber + 1);
		} catch (err) {
			console.log('err', err.message)
		}
	}
};


module.exports = pollEvents;