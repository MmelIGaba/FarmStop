exports.SEARCH_FARMS = `
  SELECT id, name, products, status, type,
    ST_Distance(location, ST_MakePoint($1, $2)::geography) as dist_meters,
    ST_Y(location::geometry) as lat, 
    ST_X(location::geometry) as lng
  FROM farms
  WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
  ORDER BY dist_meters ASC;
`;

exports.CHECK_FARM_FOR_UPDATE = `SELECT type FROM farms WHERE id = $1 FOR UPDATE`;

exports.CLAIM_FARM_UPDATE = `
  UPDATE farms 
  SET owner_id = $1, type = 'vendor', status = 'pending_verification' 
  WHERE id = $2
`;

exports.GET_FARM_BY_OWNER = `SELECT * FROM farms WHERE owner_id = $1`;
