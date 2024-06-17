const { StatusCodes } = require("http-status-codes");
const Message = require("../models/Message");
const { catchAsyncError } = require("../utils");
const User = require("../models/User");



exports.getAllChats = catchAsyncError(async (req, res, next) => {
    const { page = 1, limit = 50 } = req.query;
    const [messages, count] = await Promise.all([
        Message
            .find()
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Message.countDocuments()
    ])

    const addresses = messages.map((message) => message.author);

    const users = await User.find({
        address: { $in: addresses }
    }).lean();

    const records = messages.map(ele => {
        const user = users.find(u => u.address === ele.author);

        return {
            ...ele,
            name: user?.userName,
            image: user?.image
        }
    })

    res.status(StatusCodes.OK).json({
        success: true,
        data: records,
        count,
        totalPages: Math.ceil(count / limit),
    })
})