const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = require("./prisma");

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);
const userRoutes = require("./routes/user");
app.use("/user", userRoutes);
const storeRoutes = require("./routes/store");
app.use("/stores", storeRoutes);
const ratingRoutes = require("./routes/ratings");
app.use("/ratings", ratingRoutes);
const ownerRoutes = require("./routes/owner");
app.use("/owner", ownerRoutes);
const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);



app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
