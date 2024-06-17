const Message = require("../models/Message");
const User = require("../models/User");
const UserConnectLive = require("../models/UserCount");



let ioInstance;
exports.configureSocket = (io) => {
	ioInstance = io;

	// Function to update the user count in the database and emit it to all clients
	const updateUserCount = async () => {
		try {
			// Count the number of connected users
			const connectedUsersCount = ioInstance.engine.clientsCount;
			// console.log('connectedUsersCount', connectedUsersCount)
			// Update the user count in the database
			await UserConnectLive?.findOneAndUpdate({}, { usercount: (connectedUsersCount + 7) }, { upsert: true });

			// Emit the updated count to all clients
			io.emit('userCount', (connectedUsersCount + 7));
		} catch (error) {
			console.error("Error updating user count:", error);
		}
	};

	io.on("connection", (socket) => {
		// console.log("Connection established with socketId: ", socket?.id);
		updateUserCount();

		socket.on('join_room', (room) => {
			socket.join(room);
		});

		socket.on('send_message', async (data) => {

			const [user, _] = await Promise.all([
				User.findOne({ address: data?.author?.toLowerCase() }),
				Message.create(data)
			])

			io.to(data?.room).emit('receive_message', {
				...data,
				name: user?.userName,
				image: user?.image
			});
		});

		socket.on('start_typing', (room) => {
			io.to(room).emit('user_typing', { typing: true })
		});

		socket.on('stop_typing', (room) => {
			io.to(room).emit('user_typing', { typing: false });
		});

		socket.on('disconnect', () => {
			console.log('User disconnected: ' + socket.id);
			updateUserCount();
		});
	});
};

exports.notifyNewRoundStarted = (data) => {
	ioInstance
		.emit("NewRoundStarted", data);
};

exports.notifyRoundClose = () => {
	ioInstance
		.emit("RoundClose");
};

exports.notifyWinner = (data) => {
	console.log('calling winner', data)
	ioInstance
		.emit("WinnerSelected", data);
}

exports.notifyPlayerEnter = (data) => {
	ioInstance.emit("PlayerEnter", data);
}