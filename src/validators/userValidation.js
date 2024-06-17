const { validateRouteHandler } = require("./validator");

exports.getUserValidation = validateRouteHandler({
	address: {
		in: ["query"],
		exists: { errorMessage: "invailid user address!" },
	},
});
