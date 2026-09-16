import express from "express";

const app = express();

app.use(express.json());

// Example root route
app.get("/", (req, res) => {
  res.json({ message: "BMS Digital Dukaan API Server is running" });
});

export default app;
