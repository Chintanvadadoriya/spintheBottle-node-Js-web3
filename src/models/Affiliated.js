const mongoose = require("mongoose");


const affiliatedSchema = new mongoose.Schema({
    user: {type: String,index: true },
    affiliator: { type: String,index: true},
})


const AffiliatedUser = mongoose.model("affiliated", affiliatedSchema);

module.exports = AffiliatedUser;