require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

pool.connect()
  .then(() => {
    console.log("PostgreSQL connected");
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:");
    console.error(err.message);
});

module.exports = pool;