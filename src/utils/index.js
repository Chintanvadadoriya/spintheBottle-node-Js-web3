const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid");
const { logEvents } = require("../middleware/logger");
const BigNumber = require('bignumber.js');


exports.delay = async (ms) => new Promise((res) => setTimeout(res, ms));


exports.catchAsyncError = (func) => (req, res, next) =>
	Promise.resolve(func(req, res, next)).catch((err) => next(err));

exports.getUnixTimeStamp = (date) => {
	return Math.floor(new Date(date).getTime() / 1000);
};

class ErrorHandler extends Error {
	status;
	message;
	constructor(message, status = 400) {
		super(message);
		this.message = message;
		this.status = status;
		Error.captureStackTrace(this, this.constructor);
	}
}

exports.ErrorHandler = ErrorHandler;


exports.getPaginationDetails = (reqQuery) => {
	const page = Number(reqQuery.page) || 1;
	const limit = Number(reqQuery.limit) || 8;
	const skip = (page - 1) * limit;

	return {
		page,
		limit,
		skip,
	};

}

exports.delay = async (ms) => new Promise((res) => setTimeout(res, ms));



// const provider = new ethers.JsonRpcProvider(RPC_URLS[943]);
// const signer = new ethers.Wallet(process.env.PRIVATEKEY, provider);

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_S3_ACCESS_KEY,
		secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
	},
});

exports.uploadImages = async ({ req, bucketName, keyName }) => {
	const uploadPromises = {};
	// Group upload promises by field name
	for (const file of req.files || []) {
		const fieldname = file.fieldname.replace(/\[\]/g, "");
		const key = `${keyName}/${fieldname}/${uuidv4()}-${Date.now()}`;

		const uploadParams = {
			Bucket: bucketName,
			Key: key,
			Body: file.buffer,
			ContentType: file.mimetype,
		};

		const upload = new Upload({
			client: s3Client,
			params: uploadParams,
		});


		if (!uploadPromises[fieldname]) {
			uploadPromises[fieldname] = [];
		}

		uploadPromises[fieldname].push(
			upload.done().then(({ Key, Location }) => ({
				field: fieldname,
				key: Key,
				location: Location,
			}))
		);
	}
	const result = {};

	// Wait for all upload promises to settle for each field
	await Promise.allSettled(
		Object.entries(uploadPromises).map(async ([fieldName, promises]) => {
			result[fieldName] = [];

			const settledPromises = await Promise.allSettled(promises);
			settledPromises.forEach(({ status, value }) => {
				if (status === "fulfilled") {
					result[fieldName].push(value);
				}
			});
		})
	);

	return result;
};


exports.deleteImagesFromAWS = async ({ bucketName, keyName }) => {
	const deleteParams = {
		Bucket: bucketName,
		Key: keyName,
	};
	try {
		await s3Client.send(new DeleteObjectCommand(deleteParams));
	} catch (err) {
		logEvents(`${err.name}: ${err.message}\t`, "awss3.log");
		console.log("err", err);
	}
};


exports.indexToHexColor = (index) => {
	// Define saturation and lightness
	const saturation = 70; // Percentage
	const lightness = 50; // Percentage

	// Calculate hue - using 137.5 gives a nice distribution of colors
	const hue = index * 137.5 % 360;

	// Convert HSL to hex
	const color = hslToHex(hue, saturation, lightness);
	return color;
}

function hslToHex(h, s, l) {
	l /= 100;
	const a = s * Math.min(l, 1 - l) / 100;
	const f = n => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color).toString(16).padStart(2, '0');   // Convert to Hex and format
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

// exports.colorList=[
//     "#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FFA500", 
//     "#800080", "#FFC0CB", "#40E0D0", "#A52A2A", "#808080", 
//     "#FF00FF", "#00FFFF", "#00C400", "#008080", "#800000", 
//     "#000080", "#808000", "#FFE5B4", "#E6E6FA", "#FF7F50", 
//     "#708090", "#D2B48C", "#4B0082", "#FFD700", "#C0C0C0",

// "#7FFFD4", "#F5F5DC", "#DC143C", "#00008B", "#008B8B",
// "#B8860B", "#A9A9A9", "#006400", "#BDB76B", "#8B008B",
// "#556B2F", "#FF8C00", "#9932CC", "#8B0000", "#E9967A",
// "#8FBC8F", "#483D8B", "#2F4F4F", "#00CED1", "#9400D3",
// "#FF1493", "#00BFFF", "#1E90FF", "#B22222", "#228B22"
// ]

const colorList=[
    "#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FFA500", 
    "#800080", "#FFC0CB", "#40E0D0", "#A52A2A", "#808080", 
    "#FF00FF", "#00FFFF", "#00C400", "#008080", "#800000", 
    "#000080", "#808000", "#FFE5B4", "#E6E6FA", "#FF7F50", 
    "#708090", "#D2B48C", "#4B0082", "#FFD700", "#C0C0C0",
	"#7FFFD4", "#F5F5DC", "#DC143C", "#00008B", "#008B8B",
    "#B8860B", "#A9A9A9", "#006400", "#BDB76B", "#8B008B",
    "#556B2F", "#FF8C00", "#9932CC", "#8B0000", "#E9967A",
    "#8FBC8F", "#483D8B", "#2F4F4F", "#00CED1", "#9400D3",
    "#FF1493", "#00BFFF", "#1E90FF", "#B22222", "#228B22",
]

exports.getRandomColor=(assignedColors)=>{
	const availableColors = colorList.filter(color => !assignedColors.includes(color));
    const randomIndex = Math.floor(Math.random() * (availableColors.length-1));
    return availableColors[randomIndex];
}


// wei to ether
exports.fromWei = (amount, decimals = 18) => {
	console.log("amount", amount);
	try {
		if (!amount) {
			return new BigNumber(0).toString();
		}

		return new BigNumber(amount)
			.div(new BigNumber(10).exponentiatedBy(decimals))
			.toString();
	} catch (error) {
		console.log("exeption in fromWei ", error);
		return null;
	}
};


// ether to wei
exports.toWei = (amount, decimals = 18) => {
	try {
		if (!amount) {
			return new BigNumber(0).toString();
		}
		return new BigNumber(amount)
			.multipliedBy(new BigNumber(10).exponentiatedBy(decimals))
			.toFixed(0)
			.toString();
	} catch (error) {
		console.log("exeption in toWei , ", error);
		return null;
	}
};