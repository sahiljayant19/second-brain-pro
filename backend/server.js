const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 8000;

app.get("/health", (req, res) => {
  res.json({
    message: "Server is running",
    status: "healthy",
    service: "second-brain-pro-backend",
    timestamp: new Date().toString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});