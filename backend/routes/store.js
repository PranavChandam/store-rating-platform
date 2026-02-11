const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, email, address } = req.body;

    const store = await prisma.store.create({
      data: {
        name,
        email,
        address,
        ownerId: req.user.id,
      },
    });

    res.json({ message: "Store created ", store });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Store creation failed" });
  }
});


//  Get All Stores (Public)
router.get("/", async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        ratings: {
          select: { value: true },
        },
      },
    });

    const storesWithAvg = stores.map(store => {
      const avg =
        store.ratings.length > 0
          ? store.ratings.reduce((sum, r) => sum + r.value, 0) /
            store.ratings.length
          : 0;

      return {
        ...store,
        averageRating: Number(avg.toFixed(1)),
      };
    });

    res.json(storesWithAvg);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stores" });
  }
});



//  Store Details
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        owner: true,
        ratings: true,
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const avg =
      store.ratings.length > 0
        ? store.ratings.reduce((sum, r) => sum + r.value, 0) /
          store.ratings.length
        : 0;

    res.json({
      ...store,
      averageRating: Number(avg.toFixed(1)),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch store" });
  }
});

module.exports = router;
