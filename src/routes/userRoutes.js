const express = require("express");
const { getUserValidation } = require("../validators/userValidation");
const { getOrCreateUser, updateUser, getUsdPrice } = require("../controller/userController");
const multer  = require('multer')
const upload = multer();

const router = express.Router();

router.get("/", getUserValidation, getOrCreateUser);
router.patch("/", upload.any(), updateUser)
router.get("/get_usd_price", getUsdPrice)


module.exports = router;
