require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");



const { logEvents, logger } = require("./src/middleware/logger");
const { errorHandler } = require("./src/middleware/errorHandler");

//routes
const userRoutes = require("./src/routes/userRoutes");
const stakingRoutes = require("./src/routes/stakingRoutes");
const historyRoutes = require("./src/routes/hisoryRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const mailSendRoutes = require("./src/routes/mailSendRoutes");



const { configureSocket } = require("./src/config/socket");
const { connectDB } = require("./src/config/connectDb");
const { startListining } = require("./src/BlockchainEventSync");

const whiteList = [
	"http://52.66.71.235:3000",
	"https://spinthebottle.ai",
	"https://www.spinthebottle.ai",
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:3001",
	"http://127.0.0.1:3001",
	"http://localhost:4000/",
	"http://13.53.219.240:3000",
	"http://13.53.219.240:4000"
];

const corsOptions = {
	origin: (origin, callback) => {
		if (whiteList.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(null, false);
		}
	},
};

const app = express();

connectDB();

app.use(logger);

app.use(cors(corsOptions));

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/stacking", stakingRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/mailsend", mailSendRoutes);


const server = http.createServer(app);
let io = new Server(server, { cors: { origin: whiteList } });

io = configureSocket(io);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
	startListining();
}

if (process.env.NODE_APP_INSTANCE === '0') {
	startListining();
}


// startListining();

mongoose.connection.once("open", () => {
	console.log("Connected to MongoDB");
	server.listen(process.env.PORT, () => {
		console.log(`server is running on port ${process.env.PORT}`);
	});
});

mongoose.connection.on("error", (err) => {
	console.log(err);
	logEvents(
		`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
		"mongoErrLog.log"
	);
});
