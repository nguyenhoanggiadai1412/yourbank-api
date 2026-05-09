const express = require("express");

const router = express.Router();

const {
  getCoordinates,
} = require("../controllers/location.controller");

router.get("/geocode", getCoordinates);

module.exports = router;