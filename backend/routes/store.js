const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Create Store (Protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, email, address } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !address) {
      return res.status(400).json({
        error: "Name, email and address are required",
      });
    }

    // VALIDATION INSIDE ROUTE 👇

    if (name.length < 20 || name.length > 60) {
      return res.status(400).json({
        error: "Store name must be 20–60 characters",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    if (address.length > 400) {
      return res.status(400).json({
        error: "Address must be under 400 characters",
      });
    }

    const store = await prisma.store.create({
      data: {
        name,
        email,
        address,
        ownerId: req.user.id,
      },
    });

    res.json({
      message: "Store created ✅",
      store,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Store creation failed",
    });
  }
});


// Get All Stores 
router.get("/", async (req, res) => {
  try {
    const { search, minRating, page = 1, limit = 5 } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    const stores = await prisma.store.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {},
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        ratings: {
          select: { value: true },
        },
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    });

    let storesWithStats = stores.map(store => {
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

    //  Filter by minimum rating
    if (minRating) {
      storesWithStats = storesWithStats.filter(
        store => store.averageRating >= parseFloat(minRating)
      );
    }

    // Sort highest rated first
    storesWithStats.sort((a, b) => b.averageRating - a.averageRating);

    res.json({
      page: pageNumber,
      limit: pageSize,
      total: storesWithStats.length,
      stores: storesWithStats,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch stores",
    });
  }
});


//  Store Details 
router.get("/:id", authMiddleware, async (req, res) => {
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
      return res.status(404).json({
        error: "Store not found",
      });
    }

    const avg =
      store.ratings.length > 0
        ? store.ratings.reduce((sum, r) => sum + r.value, 0) /
          store.ratings.length
        : 0;

    const userRating = store.ratings.find(
      r => r.userId === req.user.id
    );

    res.json({
      ...store,
      averageRating: Number(avg.toFixed(1)),
      ratingCount: store.ratings.length,
      userRating: userRating ? userRating.value : null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch store",
    });
  }
});

//  Update Store (Owner only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, address } = req.body;

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    // Only owner can update
    if (store.ownerId !== req.user.id) {
      return res.status(403).json({
        error: "Not authorized to update this store",
      });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name: name || store.name,
        email: email || store.email,
        address: address || store.address,
      },
    });

    res.json({
      message: "Store updated ✅",
      store: updatedStore,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Store update failed",
    });
  }
});

// Delete Store (Owner only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    // Only owner can delete
    if (store.ownerId !== req.user.id) {
      return res.status(403).json({
        error: "Not authorized to delete this store",
      });
    }

    await prisma.store.delete({
      where: { id },
    });

    res.json({
      message: "Store deleted 🗑",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Store deletion failed",
    });
  }
});


module.exports = router;
