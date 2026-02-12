const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Owner Dashboard 
router.get("/stores", authMiddleware, async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      where: {
        ownerId: req.user.id,
      },
      include: {
        ratings: {
          select: { value: true },
        },
      },
    });

    const result = stores.map(store => {
      const avg =
        store.ratings.length > 0
          ? store.ratings.reduce((sum, r) => sum + r.value, 0) /
            store.ratings.length
          : 0;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        averageRating: Number(avg.toFixed(1)),
        ratingCount: store.ratings.length,
      };
    });

    res.json({
      stores: result,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch owner stores",
    });
  }
});

module.exports = router;
