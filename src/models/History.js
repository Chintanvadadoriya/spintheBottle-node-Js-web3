const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
	hash: { type: String, required: true, unique: true },
	address: { type: String, required: true, lowercase: true },
	prize: { type: Number },
	round: { type: Number, required: true },
	winPercentage: { type: Number },
	playerStack: {type: Number},
	playersCount: {type: Number},
	playerPercentage:  Number,
	createdTimestamp: { type: Number,index: true },
}, {
	timestamps: true,
});

historySchema.index({round: 1});

const History = mongoose.model("historys", historySchema);

module.exports = History;
