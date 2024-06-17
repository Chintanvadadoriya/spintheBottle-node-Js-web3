const mongoose = require("mongoose");

const userConnectLiveSchema = new mongoose.Schema({
	usercount: { type: Number },
});

userConnectLiveSchema.index({usercount: -1});

const UserCount = mongoose.model("UserCount", userConnectLiveSchema);

module.exports = UserCount;
