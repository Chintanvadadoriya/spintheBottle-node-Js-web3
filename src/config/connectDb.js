const mongoose = require("mongoose");
const { createClient } = require("redis");

exports.connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
	} catch (err) {
		console.log(err);
	}
};

const redisClient = createClient({
	url: process.env.REDIS_URL,
});

exports.connectRedis = async () => {
	try {
		await redisClient.connect();
		console.log("Redis client connected...");
	} catch (err) {
		console.log(err.message);
		setTimeout(connectRedis, 5000);
	}
};

exports.redis = redisClient;
