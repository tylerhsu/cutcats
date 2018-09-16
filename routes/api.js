const express = require('express');
const router = express.Router();

router.use('/couriers', require('./couriers'));
router.use('/me', require('./me'));
router.use('/rides', require('./rides'));
router.use('/payrolls', require('./payrolls'));
router.use('/invoices', require('./invoices'));
router.use('/clients', require('./clients'));
router.use('/zones', require('./zones'));

module.exports = router;
