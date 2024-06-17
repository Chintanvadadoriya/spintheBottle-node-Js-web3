const { StatusCodes } = require("http-status-codes");
const History = require("../models/History");
const { catchAsyncError, getPaginationDetails } = require("../utils");
const User = require("../models/User");
const { ADDRESS_ZERO } = require("../constant");
const Stack = require("../models/Stack");
const PrizePool = require("../models/PricePool");

// old query without aggrigation 

// exports.getHistory = catchAsyncError(async (req, res, next) => {
//     const reqQuery = { ...req.query };
//     const { skip, limit } = getPaginationDetails(reqQuery);

//     let sortBy = reqQuery.sortBy?reqQuery.sortBy:'createdAt';
//     let order = reqQuery.order ? reqQuery.order=== 'desc' ? -1 : 1:-1;

//     let match = {};
//     if (reqQuery?.search) {
//         switch (reqQuery?.search) {
//             case 'Completed':
//                 match = {
//                     address: { $ne: ADDRESS_ZERO }
//                 }
//                 break;
//             case 'Cancelled':
//                 match = {
//                     address: ADDRESS_ZERO
//                 }
//                 break;
//             case 'yourWins':
//                 match = {
//                     address: reqQuery.address
//                 }
//                 break;    
//             default:
//                 break;
//         }
//     }

//     console.log('order,sortBy', order,sortBy)
//        // Prepare sort object correctly for MongoDB
//        let sortOptions = {};
//        sortOptions[sortBy] = order;
// console.log('sortOptions', sortOptions)
//     // Retrieve history with necessary fields only
//     const historyProjection = {
//         _id:1,
//         __v:1,
//         address: 1, // only retrieve fields that are actually used
//         round: 1,
//         hash:1,
//         playerPercentage:1,
//         playerStack:1,
//         playersCount:1,
//         prize:1,
//         updatedAt:1,
//         winPercentage:1,
//         createdAt: 1,
//     };

//     const [history, count] = await Promise.all([
//         History.find(match)
//                .select(historyProjection)
//                .sort(sortOptions)
//                .skip(skip)
//                .limit(limit)
//                .lean()
//                .exec(),
//         History.countDocuments(match),
//     ]);

//     const userAddress = history.map(user => user.address);

//     const users = await User.find({
//         address: { $in: userAddress }
//     }).select({ userName: 1, image: 1,address:1 }).lean(); // Limit fields in projection

//     async function getStackerDataByRounds(rounds) {
//         const stackDataPromises = rounds.map(round => {
//             return PrizePool.findOne({ round: Number(round) })
//                             .select({ prize: 1, round: 1 })
//                             .lean();
//         });
//         return Promise.all(stackDataPromises);
//     }

//     const stackerData = await getStackerDataByRounds(history.map(h => h.round));


//     const records = history.map((ele, index) => {
//         const user = users.find(u => u.address === ele.address);
//         const stackData = stackerData[index];
//         return {
//             ...ele,
//             name: user ? user.userName : null,
//             image: user ? user.image : null,
//             prizepool: stackData ? stackData.prize : 0
//         };
//     });

//     res.status(StatusCodes.OK).json({
//         success: true,
//         count: count,
//         data: records,
//         totalPages: Math.ceil(count / limit),
//     })

// })


// new query with aagrigation

exports.getHistory = catchAsyncError(async (req, res, next) => {
    const reqQuery = { ...req.query };
    const { skip, limit } = getPaginationDetails(reqQuery);

    let sortBy = reqQuery.sortBy ? reqQuery.sortBy : 'createdAt';
    let order = reqQuery.order === 'desc' ? -1 : 1;

    let matchStage = {
        $match: {}
    };
    if (reqQuery.search) {
        switch (reqQuery.search) {
            case 'Completed':
                matchStage.$match.address = { $ne: ADDRESS_ZERO };
                break;
            case 'Cancelled':
                matchStage.$match.address = ADDRESS_ZERO;
                break;
            case 'yourWins':
                matchStage.$match.address = reqQuery.address;
                break;
        }
    }

    const lookupUsers = {
        $lookup: {
            from: "users",
            localField: "address",
            foreignField: "address",
            as: "userData"
        }
    };

    const lookupPrizePool = {
        $lookup: {
            from: "prizepools",
            localField: "round",
            foreignField: "round",
            as: "prizeData"
        }
    };

    const addFields = {
        $addFields: {
            userData: { $arrayElemAt: ["$userData", 0] },
            prizeData: { $arrayElemAt: ["$prizeData", 0] }
        }
    };

    const projectStage = {
        $project: {
            _id: 1,
            address: 1,
            round: 1,
            hash: 1,
            playerPercentage: 1,
            playerStack: 1,
            playersCount: 1,
            prize: 1,
            updatedAt: 1,
            winPercentage: 1,
            createdAt: 1,
            name: "$userData.userName",
            image: "$userData.image",
            prizepool: "$prizeData.prize",
            createdTimestamp:1
        }
    };

    const sortStage = {
        $sort: { [sortBy]: order }
    };

    const skipStage = { $skip: skip };
    const limitStage = { $limit: limit };

    const pipeline = [
        matchStage,
        lookupUsers,
        lookupPrizePool,
        addFields,
        projectStage,
        sortStage,
        skipStage,
        limitStage
    ];

    // Executing the aggregation pipeline
    const records = await History.aggregate(pipeline).exec();

    // Count total documents for pagination
    const count = await History.countDocuments(matchStage.$match);

    res.status(StatusCodes.OK).json({
        success: true,
        count: count,
        data: records,
        totalPages: Math.ceil(count / limit),
    });
});






exports.getRoundHistory = catchAsyncError(async (req, res, next) => {
    
    const reqQuery = { ...req.query }
    const { round } = reqQuery;
    const { skip, limit } = getPaginationDetails(reqQuery);

   


    const [stackers, count, prizePool,hestory] = await Promise.all([
        Stack.find({
            round: Number(round)
        }).lean(),
        Stack.countDocuments({
            round: Number(round)
        }),
        PrizePool.findOne({
            round: Number(round)
        }),
        History.findOne({
            round: Number(round)
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
        totalStack: prizePool?.prize,
        roundData: prizePool,
        winnerPrice:hestory?.prize || 0,
        round:hestory?.round || 0

    });


})