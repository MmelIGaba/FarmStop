const Joi = require('joi');

const searchSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radiusInKm: Joi.number().min(1).max(500).optional() 
});

const userSyncSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('user', 'vendor', 'admin').optional() 
});

module.exports = { searchSchema, userSyncSchema };
module.exports = { searchSchema };
