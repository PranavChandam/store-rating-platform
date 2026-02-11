const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Create / Update Rating
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { storeId, value } = req.body;

    // Validation
    if (value < 1 || value > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5",
      });
    }

    const rating = await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId: req.user.id,
          storeId: storeId,
        },
      },
      update: { value },
      create: {
        value,
        userId: req.user.id,
        storeId,
      },
    });

    res.json({
      message: "Rating submitted ⭐",
      rating,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rating failed" });
  }
});


module.exports = router;
