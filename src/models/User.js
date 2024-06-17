const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	userName: { type: String, unique: true, sparse: true},
	ensName: { type: String, default: null },
	email: { type: String, default: null },
	bio: { type: String, default: null },
	address: { type: String, unique: true, lowercase: true },
	nonce: { type: Number, defuault: Math.floor(Math.random() * 1000000) },
	image: { type: String },
	imageKey: { type: String, select: false} ,
	refrelCode: { type: String },
	refrelUrl: { type: String},
	fullName: { type: String}
});

userSchema.index({ address: 1 });

const User = mongoose.model("Users", userSchema);

module.exports = User;
