const pool = require("../config/db");
const logger = require("../config/logger");
const queries = require("../queries/authQueries");
const farmQueries = require("../queries/farmQueries");

exports.syncUser = async (req, res, next) => {
  const { role, name, email } = req.body;
  const id = req.user.id;

  try {
    await pool.query(queries.UPSERT_USER, [id, email, role || "user", name]);

    logger.info(`User synced: ${id}`);
    res.json({ message: "User synced successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  const id = req.user.id;

  try {
    const userResult = await pool.query(queries.GET_USER_BY_ID, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    let farm = null;

    if (user.role === "vendor") {
      const farmResult = await pool.query(farmQueries.GET_FARM_BY_OWNER, [id]);
      farm = farmResult.rows[0] || null;
    }

    res.json({ ...user, farm });
  } catch (error) {
    next(error);
  }
};
