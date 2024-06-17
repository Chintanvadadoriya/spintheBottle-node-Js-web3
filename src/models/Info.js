const mongoose = require("mongoose");


const infoSchema = new mongoose.Schema({
    key: { type: String, default: 'key' },
    round: { type: Number, default: 1 },
    miniBonusRoundFriquvency: { type: Number, required: true },
    megaBonusRoundFriquvency: { type: Number, required: true },
    superBonusRoundFriquvency: { type: Number, required: true },
    nextMiniBonusRound: { type: Number},
    nextMegaBonusRound: { type: Number},
    nextSuperBonusRound: { type: Number},
})

const Info = mongoose.model("info", infoSchema);

module.exports = Info;