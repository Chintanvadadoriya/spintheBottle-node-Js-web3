const { ethers } = require("ethers");
const { notifyNewRoundStarted, notifyWinner, notifyPlayerEnter } = require("../../config/socket");
const PrizePool = require("../../models/PricePool");
const Info = require("../../models/Info");
const Hash = require("../../models/Hash");
const History = require('../../models/History');
const { delay, getRandomColor, fromWei } = require("../../utils");
const Stack = require("../../models/Stack");
const AffiliatedUser = require("../../models/Affiliated");

let colorIndex = 0;

exports.hashExist = async (event) => {
    const transactionHash = event.transactionHash;
    const logIndex = event.logIndex;

    const log = await Hash.findOne({
        transactionHash,
        logIndex
    });

    return log
}

exports.hashCreate = async (event) => {
    const transactionHash = event.transactionHash;
    const logIndex = event.logIndex;

    return await Hash.create({
        transactionHash,
        logIndex
    })
}

exports.newRoundAction = async ({ round, prize, start, isBonus, transactionHash }) => {
    try {

        const log = await PrizePool.findOne({
            transactionHash,
        });

        if (!log) {
            const [_, info] = await Promise.all([
                PrizePool.findOneAndUpdate({ round: round },
                    {
                        round: round,
                        prize: fromWei(prize),
                        start: start,
                        isBonus: isBonus,
                        bonusPrize: prize,
                        transactionHash: transactionHash

                    }, {
                    upsert: true,
                    new: true
                }),
                Info.findOne({
                    key: 'key'
                })
            ]);

            info.round = round;

            if (info.round % info.miniBonusRoundFriquvency === 0) {
                info.nextMiniBonusRound = info.round + info.miniBonusRoundFriquvency;
            }
            if (info.round % info.megaBonusRoundFriquvency === 0) {
                info.nextMegaBonusRound = info.round + info.megaBonusRoundFriquvency;
            }
            if (info.round % info.superBonusRoundFriquvency === 0) {
                info.nextSuperBonusRound = info.round + info.superBonusRoundFriquvency;
            }

            await info.save();

            notifyNewRoundStarted({
                round: round,
                start: start + 121
            });

        }
    } catch (err) {
        console.log('err1612', err)
    }
}

exports.winnerSelectedAction = async ({ round, user, prize, transactionHash, event }) => {

    try {

        const log = await History.findOne({
            hash: transactionHash,
        });

        if (!log) {

            const [stack, playersCount] = await Promise.all(
                [
                    Stack.findOne({
                        round: round,
                        userAddresses: user,
                    }),
                    Stack.countDocuments({
                        round: round,
                    })
                ]
            );

            notifyWinner({
                address: user,
                prize: prize,
                round: round,
                // winPercentage: stack ? ((prize - stack?.stake) / stack?.stake) * 100 : 0,
                // winPercentage: stack ? (prize-stack?.stake)/ stack?.stake : 0,
                winPercentage: stack ? (prize / stack?.stake) : 0,

            })

            const timestamp = await event?.getBlock()
            //prize = totalStackeamount / stack?.stake ==winnner stacked amount
            await Promise.all([
                History.findOneAndUpdate({
                    round: round,
                    address: user,
                }, {
                    hash: transactionHash,
                    address: user,
                    prize: prize,
                    round: round,
                    // winPercentage: stack ? (prize / stack?.stake) * 100 : 0,
                    winPercentage: stack ? (prize / stack?.stake) : 0,
                    // winPercentage: stack ? (prize-stack?.stake)/ stack?.stake : 0,
                    playerStack: stack ? stack?.stake : 0,
                    playersCount,
                    playerPercentage: stack ? stack.percentage : 0,
                    createdTimestamp: timestamp?.timestamp || null
                }, {
                    upsert: true,
                    new: true,
                })
            ])
            if (stack) {
                stack.winner = true;
                await stack.save();
            }
            await delay(2000);
            //console.log('hear')

        }


    } catch (err) {
        console.log('err', err)
    }
}

// new query select  1 to 25 color range 
exports.enteredAction = async ({ round, user, amount, transactionHash }) => {
    try {

        const log = await Stack.findOne({
            transactionHash: transactionHash
        });
        if (!log) {
            let stack = await Stack.findOne({
                userAddresses: user,
                round: round
            });

            let color;

            if (stack && stack.color) {
                // User already has a color assigned
                color = stack.color;
            } else {
                // Assign a new random color
                const assignedColors = await Stack.distinct("color", { round: round });
                color = getRandomColor(assignedColors);
            }

            stack = await Stack.findOneAndUpdate({
                userAddresses: user,
                round: round,
            }, {
                userAddresses: user,
                $inc: { stake: amount },
                round: round,
                color: color,
                transactionHash: transactionHash,
            }, {
                upsert: true,
                new: true,
            });

            const [prizePool] = await Promise.all([
                PrizePool.findOneAndUpdate({
                    round: round,
                }, {
                    $inc: { prize: amount },
                }, {
                    upsert: true,
                    new: true,
                })
            ]);


            const amounts = await Stack.aggregate([
                {
                    $match: {
                        round: round // match documents with the specific round
                    }
                },
                {
                    $group: {
                        _id: null, // group all matched documents together
                        totalStake: { $sum: "$stake" } // calculate the sum of the stake field
                    }
                }
            ])

            if (amounts.length) {

                await Stack.updateMany({
                    round: round,
                }, [
                    {
                        $set: {
                            percentage: {
                                $multiply: [
                                    { $divide: ["$stake", amounts[0].totalStake] },
                                    100
                                ]
                            }
                        }
                    }
                ])
            }
            // colorIndex += 1;
            await delay(1000);
            notifyPlayerEnter({
                round,
                user,
                amount
            })
        }

    } catch (err) {
        console.log('err', err)
    }
}

exports.affiliatedAction = async ({ user, affilator }) => {
    try {
        let affiliatedUser = await AffiliatedUser.findOneAndUpdate({
            user: user,
            affiliator: affilator,
        }, {
            user: user,
            affiliator: affilator,
        }, {
            upsert: true,
            new: true,
        });

    } catch (error) {
        console.log("affiliatoreAction", error)
    }
}