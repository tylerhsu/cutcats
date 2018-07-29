const express = require('express');
const router = express.Router();

router.get('/', getMe);

function getMe (req, res) {
  res.json(req.user);
}

module.exports = router;
