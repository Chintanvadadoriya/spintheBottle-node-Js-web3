const express = require('express');
const { getRoundsPlayers, getRoundDetails } = require('../controller/stackController');

const router = express.Router();

router.get('/', getRoundsPlayers);
router.get('/round-info', getRoundDetails)

module.exports = router;