exports.UPSERT_USER = `
  INSERT INTO users (id, email, role, name, updated_at)
  VALUES ($1, $2, $3, $4, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email, 
    role = COALESCE(users.role, EXCLUDED.role),
    name = EXCLUDED.name, 
    updated_at = NOW();
`;

exports.GET_USER_BY_ID = `SELECT * FROM users WHERE id = $1`;

exports.UPDATE_USER_ROLE = `UPDATE users SET role = $1 WHERE id = $2`;
