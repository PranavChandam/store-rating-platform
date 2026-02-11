const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { storeId, value } = req.body;

    // Validate rating value
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5",
      });
    }

    // Validate storeId
    if (!storeId) {
      return res.status(400).json({
        error: "Store ID is required",
      });
    }

    //  Check store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    //  Prevent owner rating own store
    if (store.ownerId === req.user.id) {
      return res.status(403).json({
        error: "Owners cannot rate their own store",
      });
    }

    //  Create or update rating
    const rating = await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId: req.user.id,
          storeId,
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
    res.status(500).json({
      error: "Rating failed",
    });
  }
});

module.exports = router;
