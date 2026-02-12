const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


//  Owner → View My Stores + Rating Stats
router.get("/stores", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "OWNER") {
      return res.status(403).json({
        error: "Access denied. Store owners only.",
      });
    }

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

    res.json({ stores: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch owner stores",
    });
  }
});


//  Owner → View Users Who Rated My Store
router.get("/store/:id/ratings", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "OWNER") {
      return res.status(403).json({
        error: "Access denied. Store owners only.",
      });
    }

    const storeId = parseInt(req.params.id);

    // Check store belongs to owner
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    if (store.ownerId !== req.user.id) {
      return res.status(403).json({
        error: "Not authorized to view ratings of this store",
      });
    }

    // Fetch ratings + user details
    const ratings = await prisma.rating.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formatted = ratings.map(rating => ({
      userId: rating.user.id,
      name: rating.user.name,
      email: rating.user.email,
      rating: rating.value,
    }));

    res.json({
      storeId,
      totalRatings: ratings.length,
      ratings: formatted,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch store ratings",
    });
  }
});

module.exports = router;
