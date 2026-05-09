const express = require("express");

const locationRoutes = require("./routes/location.routes");

const app = express();

app.use(express.json());

app.use("/api/location", locationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Goong Geocoding API Running",
  });
});

module.exports = app;