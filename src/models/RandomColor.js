const mongoose = require("mongoose");


const rendomColorSchema = new mongoose.Schema({
    colors: [{type: String}],
    round: { type: Number, required: true },
})

rendomColorSchema.index({round: -1});

const RandomColor = mongoose.model("randomcolors", rendomColorSchema);

module.exports = RandomColor;