const mongoose = require("mongoose");

const hashSchema = new mongoose.Schema({
	transactionHash: {type: String},
	logIndex: {type: Number},
    createdAt: { type: Date, default: Date.now, expires: 3600 * 6 }
});

hashSchema.index({transactionHash: -1, logIndex: -1});

const Hash = mongoose.model("hash", hashSchema);

module.exports = Hash;
