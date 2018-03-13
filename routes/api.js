const express = require('express');
const router = express.Router();

router.use('/couriers', require('./couriers'));
router.use('/me', require('./me'));
router.use('/jobs', require('./jobs'));
router.use('/reports', require('./reports'));
router.use('/clients', require('./clients'));
router.use('/zones', require('./zones'));

module.exports = router;
