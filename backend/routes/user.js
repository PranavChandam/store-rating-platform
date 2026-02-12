const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Get My Profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
      },
    });

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch profile",
    });
  }
});


//  Get All Users (Admin only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    const users = await prisma.user.findMany({
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


//  Update Password
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be 8–16 chars, include uppercase & special char",
      });
    }

    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({
      message: "Password updated ✅",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Password update failed",
    });
  }
});

module.exports = router;
