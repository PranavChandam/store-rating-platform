const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Middleware → Admin Only
const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Access denied. Admins only.",
    });
  }
  next();
};


//  Admin Dashboard Stats
router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalStores = await prisma.store.count();
    const totalRatings = await prisma.rating.count();

    res.json({
      totalUsers,
      totalStores,
      totalRatings,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch admin stats",
    });
  }
});


//  Admin → List Users (WITH FILTERS)
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, address, role } = req.query;

    const users = await prisma.user.findMany({
      where: {
        name: name
          ? { contains: name, mode: "insensitive" }
          : undefined,
        email: email
          ? { contains: email, mode: "insensitive" }
          : undefined,
        address: address
          ? { contains: address, mode: "insensitive" }
          : undefined,
        role: role || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
      },
    });

    res.json(users);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});


router.get("/stores", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, address } = req.query;

    const stores = await prisma.store.findMany({
      where: {
        name: name
          ? { contains: name, mode: "insensitive" }
          : undefined,
        email: email
          ? { contains: email, mode: "insensitive" }
          : undefined,
        address: address
          ? { contains: address, mode: "insensitive" }
          : undefined,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        ratings: {
          select: { value: true },
        },
      },
    });

    const storesWithStats = stores.map(store => {
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
        owner: store.owner,
        averageRating: Number(avg.toFixed(1)),
        ratingCount: store.ratings.length,
      };
    });

    res.json(storesWithStats);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch stores",
    });
  }
});

module.exports = router;
