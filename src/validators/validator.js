const { validationResult, checkSchema } = require("express-validator");
const { ErrorHandler } = require("../utils");
const { StatusCodes } = require("http-status-codes");

const routeError = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const errorArray = errors.array()?.map((err) => err?.msg);
		return next(
			new ErrorHandler(errorArray, StatusCodes.UNPROCESSABLE_ENTITY)
		);
	}
	next();
};

const saveOriginalRequestData = (req, res, next) => {
	res.locals.originalBody = { ...req.body };
	res.locals.originalParams = { ...req.params };
	next();
};

module.exports.validateRouteHandler = (schema) => {
	return [saveOriginalRequestData, checkSchema(schema), routeError];
};
