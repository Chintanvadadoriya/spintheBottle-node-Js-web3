const express = require('express');
const { mailSend } = require('../controller/mailSendController');

const router = express.Router();

router.post('/send', mailSend)

module.exports = router;