const express = require('express');
const router = express.Router();

router.use('/couriers', require('./couriers'));

module.exports = router;
