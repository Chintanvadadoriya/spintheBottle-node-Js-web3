const { Schema } = require('mongoose');
const mongoose = require('mongoose');

const messageSchema = new Schema({
    room: String,
    author: { type: String, lowercase: true },
    message: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
})

messageSchema.index({ timestamp: -1 });

const Message = mongoose.model('messages', messageSchema);

module.exports = Message;