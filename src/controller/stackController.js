const { StatusCodes } = require("http-status-codes");
const PrizePool = require("../models/PricePool");
const Stack = require("../models/Stack");
const { catchAsyncError, getPaginationDetails } = require("../utils");
const Info = require("../models/Info");
const User = require("../models/User");
const UserCount = require("../models/UserCount");



exports.getRoundsPlayers = catchAsyncError(async (req, res, next) => {

    const reqQuery = { ...req.query }
    const { skip, limit } = getPaginationDetails(reqQuery);

    
    let round;
    
    if(!reqQuery.round) {
        const info = await Info.findOne({ key: 'key' });
        round = info?.round;
    } else {
        round = Number(reqQuery.round)
    }



    const [stackers, count, prizePool] = await Promise.all([
        Stack.find({
            round
        }).lean(),
        Stack.countDocuments({
            round
        }),
        PrizePool.findOne({
            round
        }),
        
    ]);

    const userAddress = stackers.map(user => user.userAddresses);

    const users = await User.find({
        address: { $in: userAddress }
    }).lean();

    const records = stackers.map(ele => {
        const user = users.find(u => u.address === ele.userAddresses);

        return {
            ...ele,
            name: user?.userName,
            image: user?.image
        }
    })


    res.status(StatusCodes.OK).json({
        success: true,
        count: count,
        data: records,
        totalPages: Math.ceil(count / limit),
        totalStack: prizePool?.prize
    });
})


exports.getRoundDetails = catchAsyncError(async (req, res, next) => {


    const reqQuery = { ...req.query }

    let round;
    
    if(!reqQuery.round) {
        const info = await Info.findOne({ key: 'key' });
        round = info?.round;
    } else {
        round = Number(reqQuery.round)
    }

    const [prizePool, stack, count, info,amounts,userCount] = await Promise.all([
        PrizePool.findOne({
            round: Number(round)
        }),
        Stack.findOne({
            round: Number(round),
            userAddresses: reqQuery?.account?.toLowerCase()
        }),
        Stack.countDocuments({
            round: Number(round)
        }),
        Info.findOne({ key: 'key'}),
        Stack.aggregate([
            {
                $match: {
                    round: Number(round) // match documents with the specific round
                }
            },
            {
                $group: {
                    _id: null, // group all matched documents together
                    totalStake: { $sum: "$stake" } // calculate the sum of the stake field
                }
            }
        ]),
        UserCount.findOne({})
    ]);


    res.status(StatusCodes.OK).json({
        success: true,
        data: {
            round: prizePool?.round,
            start: prizePool?.start + 120,
            prize: amounts[0]?.totalStake || 0,
            players: count,
            yourStack: stack?.stake,
            yourWinnigChance: stack?.percentage,
            isRuondRunning: prizePool?.isRunning,
            isBonus: prizePool?.isBonus,
            bonusPrize:prizePool?.bonusPrize,
            userCount:userCount?.usercount
        },
        bonusRoundDetails: {
            mini: info?.nextMiniBonusRound,
            mega: info?.nextMegaBonusRound,
            super: info?.nextSuperBonusRound,
        }
    })
})