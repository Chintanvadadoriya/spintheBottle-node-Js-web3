const mongoose = require("mongoose");

const pricePoolSchema = new mongoose.Schema({
	round: { type: Number, required: true },
	prize: { type: Number, required: true },
	start: { type: Number, required: true },
	isBonus: { type: Boolean, required: true },
	isRunning: { type: Boolean, default: true },
	bonusPrize: { type: Number,required: true},
	transactionHash: {type: String, unique: true},
	logIndex: {type: Number}

});

pricePoolSchema.index({round: -1});

const PrizePool = mongoose.model("prizepools", pricePoolSchema);

module.exports = PrizePool;
