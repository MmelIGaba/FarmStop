require("dotenv").config();
const app = require("./app");
const logger = require("./config/logger");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Check health: http://localhost:${PORT}/health/ready`);
});

process.on("unhandledRejection", (err, promise) => {
  logger.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
