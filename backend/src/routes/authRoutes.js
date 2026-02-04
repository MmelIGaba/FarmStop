const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { userSyncSchema } = require('../utils/validationSchemas');

router.post(
  '/sync', 
  authMiddleware, 
  validate(userSyncSchema), 
  authController.syncUser
);

router.get(
  '/me', 
  authMiddleware, 
  authController.getCurrentUser
);

module.exports = router;