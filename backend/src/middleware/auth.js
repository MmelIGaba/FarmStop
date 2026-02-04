const { CognitoJwtVerifier } = require("aws-jwt-verify");
const logger = require('../config/logger');

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifier.verify(token);
    req.user = { id: payload.sub, email: payload.email || payload.username };
    next();
  } catch (error) {
    logger.error(`Auth Failed: ${error.message}`);
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = authMiddleware;
