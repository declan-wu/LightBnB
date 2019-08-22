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
// const addUser =  function(user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// }

const addUser = user => {
  const queryStr = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3) RETURNING *
  `;
  const values = [user.name, user.email, user.password];

  return pool
    .query(queryStr, values)
    .then(res => user)
    .catch(err => err);
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

const getAllProperties = (options, limit = 10) => {
  const queryParams = [];

  let queryStr = `
    SELECT properties.*, avg(rating) AS average_rating 
    FROM properties
    JOIN property_reviews
    ON properties.id = property_id
  `;

  //FILTERS IF MULTIPLE FILTERS, NEED [MORE ANDS ON WHERE]
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryStr += `
      WHERE city LIKE $${queryParams.length}
    `;
  }

  //NEED TO ADD ID
  if (options.id) {
    queryParams.push(options.id);
    if (!queryParams.length) {
      queryStr += `
        WHERE id = $${queryParams.length}
      `;
    } else {
      queryStr += `
        AND id = $${queryParams.length}
      `;
    }
  }

  //ADJUST FROM CENTS TO DEFAULT DOLLARS ON SEARCH
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryParams.push(options.maximum_price_per_night * 100);
    if (!queryParams.length) {
      queryStr += `
        WHERE cost_per_night >= $${queryParams.length - 1}
        AND cost_per_night <= $${queryParams.length}
      `;
    } else {
      queryStr += `
        AND cost_per_night >= $${queryParams.length - 1}
        AND cost_per_night <= $${queryParams.length}
      `;
    }
  }

  queryParams.push(limit);

  //IF MIN RATING SET CHECK
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryStr += `
      GROUP BY properties.id
      HAVING avg(rating) >= $${queryParams.length}
      ORDER BY cost_per_night
      LIMIT $${queryParams.length - 1};
    `;
  } else {
    queryStr += `
      GROUP BY properties.id
      ORDER BY cost_per_night
      LIMIT $${queryParams.length};
    `;
  }

  console.log(queryStr, queryParams);

  return pool.query(queryStr, queryParams).then(res => res.rows);
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
