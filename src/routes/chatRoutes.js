const express = require('express');
const { getAllChats } = require('../controller/chatController');

const router = express.Router();

router.get('/', getAllChats)

module.exports = router;