const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { searchSchema } = require('../utils/validationSchemas');

router.post('/search', validate(searchSchema), farmController.searchFarms);

router.post('/:farmId/claim', authMiddleware, farmController.claimFarm);

module.exports = router;
