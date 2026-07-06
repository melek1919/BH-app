const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from Express 👋" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});