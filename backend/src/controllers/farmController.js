const pool = require("../config/db");
const logger = require("../config/logger");
const queries = require("../queries/farmQueries");
const authQueries = require("../queries/authQueries");

exports.searchFarms = async (req, res, next) => {
  const { lat, lng, radiusInKm } = req.body;
  const radiusMeters = (radiusInKm || 50) * 1000;

  try {
    const { rows } = await pool.query(queries.SEARCH_FARMS, [
      lng,
      lat,
      radiusMeters,
    ]);

    const results = rows.map((farm) => ({
      ...farm,
      distance: (farm.dist_meters / 1000).toFixed(1) + " km",
      lat: parseFloat(farm.lat),
      lng: parseFloat(farm.lng),
    }));

    res.json(results);
  } catch (error) {
    next(error);
  }
};

exports.claimFarm = async (req, res, next) => {
  const { farmId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const checkRes = await client.query(queries.CHECK_FARM_FOR_UPDATE, [
      farmId,
    ]);

    if (checkRes.rows.length === 0) throw new Error("Farm not found");
    if (checkRes.rows[0].type !== "lead")
      throw new Error("Farm already claimed");

    await client.query(queries.CLAIM_FARM_UPDATE, [userId, farmId]);

    await client.query(authQueries.UPDATE_USER_ROLE, ["vendor", userId]);

    await client.query("COMMIT");

    logger.info(`Farm ${farmId} claimed by user ${userId}`);
    res.json({ message: "Farm claimed successfully!" });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.message === "Farm not found")
      return res.status(404).json({ error: error.message });
    if (error.message === "Farm already claimed")
      return res.status(409).json({ error: error.message });
    next(error);
  } finally {
    client.release();
  }
};
