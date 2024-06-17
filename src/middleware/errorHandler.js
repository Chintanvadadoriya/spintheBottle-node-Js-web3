exports.errorHandler = (err, req, res, next) => {
	console.log("err", err);
	res.status(err?.status || 500).json({
		success: false,
		message: err.message,
		status: err.status,
		err: err,
	});
};
