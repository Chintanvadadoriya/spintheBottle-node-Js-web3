const express = require('express');
const { getHistory, getRoundHistory } = require('../controller/historyController');

const router = express.Router();

router.get('/', getHistory);
router.get('/round',getRoundHistory)

module.exports = router;