require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const letterRoutes = require("./routes/letterRoutes");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/users", userRoutes);
app.use("/api/letters", letterRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
