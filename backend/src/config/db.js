const { Pool } = require("pg");
const logger = require("./logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, 
  },
});


pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err);
  process.exit(-1);
});
pool.connect()
  .then(client => {
    return client.query("SELECT NOW()")
      .then(res => {
        console.log("✅ Database connected at:", res.rows[0].now);
        client.release();
      })
      .catch(err => {
        console.error("❌ Startup DB check failed:", err.message);
      });
  });


module.exports = pool;
