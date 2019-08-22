const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb"
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = email => {
  const queryStr = "SELECT * FROM users WHERE email = $1";
  return pool
    .query(queryStr, [email])
    .then(res => res.rows[0])
    .catch(err => null);
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = id => {
  const queryStr = "SELECT * FROM users WHERE id = $1";
  return pool
    .query(queryStr, [id])
    .then(res => res.rows[0])
    .catch(err => err);
};

exports.getUserWithId = getUserWithId;
/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const values = [user.name, user.password, user.email];
  const queryString = `
  INSERT INTO users (name, password, email) VALUES ($1, $2, $3);`;
  pool.query(queryString, values); // should i handle failiure?
  return getUserWithEmail(user);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

const getAllReservations = (guest_id, limit = 10) => {
  const queryStr = `
    SELECT reservations.*, properties.* 
    FROM reservations
    JOIN properties ON property_id = properties.id 
    WHERE guest_id = $1 
    LIMIT $2
  `;
  const values = [guest_id, limit];
  return pool
    .query(queryStr, values)
    .then(res => res.rows)
    .catch(err => err);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  // console.log(options);
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
    queryParams.push(options.owner_id);
    whereClauses.push(`owner_id = $${queryParams.length} `);
  }
  // price range
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night));
    queryParams.push(Number(options.maximum_price_per_night));
    whereClauses.push(
      `cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${
        queryParams.length
      } `
    );
  }
  // min rating
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    whereClauses.push(`rating >= $${queryParams.length} `);
  }
  // join all the where clause
  if (queryParams.length !== 0) {
    whereClauses[0] = "WHERE " + whereClauses[0];
    queryString += whereClauses.join("AND ");
  }
  // complete the query
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // console.log(queryString, queryParams);
  return pool.query(queryString, queryParams).then(res => res.rows);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

exports.addProperty = addProperty;
