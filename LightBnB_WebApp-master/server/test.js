const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  const whereClauses = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id 
  `;

  // city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    whereClauses.push(`city LIKE $${queryParams.length} `);
  }
  // owner id
  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    whereClauses.push(`owner_id = $${queryParams.length} `);
  }
  // price range
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`%${options.minimum_price_per_night}%`);
    queryParams.push(`%${options.maximum_price_per_night}%`);
    whereClauses.push(
      `cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${
        queryParams.length
      } `
    );
  }
  // min rating
  if (options.minimum_rating) {
    queryParams.push(`%${options.minimum_rating}%`);
    whereClauses.push(`rating >= $${queryParams.length} `);
  }
  // join all the where clause
  if (queryParams.length !== 0) {
    whereClauses[0] = "WHERE " + whereClauses[0];
    whereClauses.join("AND ");
  }
  // complete the query
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);
  return pool.query(queryString, queryParams).then(res => res.rows);
};
