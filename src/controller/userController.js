const { ethers } = require("ethers");
const { catchAsyncError, deleteImagesFromAWS, uploadImages, ErrorHandler } = require("../utils");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const { v4: uuid } = require("uuid");
const { CONTRACT_ADDRESS, RPC_URL, ETHERUM_RPC, getRandomAvatar } = require("../constant");
const { isAddress } = require("ethers/lib/utils");
const { 
	// relayer, 
	contract } = require("../BlockchainEventSync/services/provider");

const ethSignUtil = require("eth-sig-util");
const ethereumjsUtil = require("ethereumjs-util");
const otpGenerator = require('otp-generator');
const { redis } = require("../config/connectDb");
const AffiliatedUser = require("../models/Affiliated");




exports.getOrCreateUser = catchAsyncError(async (req, res, next) => {

	const user = await User.findOne({
		address: req.query.address?.toLowerCase(),
	});


	if (user) {
		return res.status(StatusCodes.OK).json({
			success: true,
			data: user,
		});
	}
	let ensName = "";
    let referCode=otpGenerator.generate(10, { upperCaseAlphabets: false, specialChars: false });
 
	if (isAddress(req.query.address?.toLowerCase())) {
		const provider = new ethers.providers.JsonRpcProvider(ETHERUM_RPC);
		ensName = await provider.lookupAddress(
			req.query.address.toLowerCase()
		);
	};


	if (req.query.refrelCode) {
		const refrelUser = await User.findOne({
			refrelCode: req.query.refrelCode,
		})

		const affilatedUser = await AffiliatedUser.findOne({
			user: req.query.address?.toLowerCase(),
		})
		if (refrelUser && !affilatedUser) {
			// const tx = await relayer.sendTransaction({
			// 	to: CONTRACT_ADDRESS,
			// 	value: '0x00',
			// 	data: contract.interface.encodeFunctionData('addAffiliator', [req.query.address, refrelUser.address]),
			// 	speed: 'safeLow',
			// 	gasLimit: 10000000,
			// });
			const tx = await contract.addAffiliator(req.query.address, refrelUser.address);
			console.log('tx', tx)
		}
	}


	// const refrelCode = `${uuid()}${Date.now()}`;
	const refrelCode = referCode


	const refrelUrl = `${req.headers.origin}/game?refrelCode=${refrelCode}`
	const logo = `https://api.dicebear.com/8.x/bottts-neutral/svg/seed=${getRandomAvatar()}`;
	let newUser = {
		address: req.query.address.toLowerCase(),
		ensName: ensName || "",
		name: "NoName",
		nonce: Math.floor(Math.random() * 1000000),
		refrelCode: refrelCode,
		refrelUrl: refrelUrl,
		userName: req?.query?.address?.toLowerCase()?.slice(-6),
		image:logo
	};
	const newUserRecord = await User.create(newUser);
	res.status(StatusCodes.CREATED).json({
		status: true,
		data: newUserRecord,
	});
});


exports.updateUser = catchAsyncError(async (req, res, next) => {
	const address = req.body?.address?.toLowerCase();

	const { userName, bio } = req.body;



	const user = await User.findOne({
		address: address,
	}).select("+imageKey");
	if (!user) {
		return next(new ErrorHandler('User not found', StatusCodes.NOT_FOUND))
	}

	if (userName) {
		const founUser = await User.findOne({ address: { $ne: address }, userName: userName });
		if (founUser) {
			return next(new ErrorHandler('Username already taken', StatusCodes.BAD_REQUEST))
		}
		user.userName = userName;
	}

	const imagesData = await uploadImages({
		req,
		bucketName: process.env.AWS_S3_FILE_BUCKET,
		keyName: `${process.env.AWS_S3_FILE_BUCKET}`,
	});

	console.log('user', user)

	if (imagesData["image"] && imagesData["image"][0]) {
		await deleteImagesFromAWS({
			bucketName: process.env.AWS_S3_FILE_BUCKET,
			keyName: user.imageKey,
		});
		user.image = imagesData["image"][0]?.location;
		user.imageKey = imagesData["image"][0]?.key;
	}

	console.log('imagesData', imagesData)
	user.bio = bio=='null'?'':bio;

  // check out signature validation
  const msg = `I want to update my profile :${address}:${user.nonce}`;
  const msgBufferHex = ethereumjsUtil.bufferToHex(Buffer.from(msg, "utf-8"));
  console.log('msgBufferHex', msgBufferHex)
  const publicAddress = ethSignUtil.recoverPersonalSignature({
	  data: msgBufferHex,
	  sig: req.body.signature,
  });

  console.log('publicAddress', publicAddress)
  if (publicAddress.toLocaleLowerCase() !== address) {
	  return next(new ErrorHandler("invalid signature"));
  }

	await user.save();

	res.status(StatusCodes.OK).json({
		status: true,
		data: user,
		message: "User updated successfully",
	});


});

exports.getUsdPrice=catchAsyncError(async(req,res,next)=>{
  try{
	let maticPrice = await redis.get("maticPrice");
	res.status(200).json({
		value:maticPrice
	})
  }catch(error){
	console.log('getUsdPrice Controller error', error)
	res.status(500).json({"error":error})
  }
})