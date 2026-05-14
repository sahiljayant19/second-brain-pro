const express = require("express");
const cors = require("cors");
const path = require("path");
require('dotenv').config();

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});