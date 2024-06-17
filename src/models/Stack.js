const mongoose = require("mongoose");

const stackSchema = new mongoose.Schema({
	round: { type: Number, required: true },
	userAddresses: { type: String, required: true, lowercase: true },
	stake: { type: Number, required: true },
	percentage: { type: Number },
	color: { type: String },
	winner: {type: Boolean, default: false},
	transactionHash: { type: String, unique: true },
	logIndex: {type: Number}
}, {
	timestamps: true,
});

stackSchema.index({"round": -1});
stackSchema.index({"userAddresses": -1});


const Stack = mongoose.model("stacks", stackSchema);

module.exports = Stack;