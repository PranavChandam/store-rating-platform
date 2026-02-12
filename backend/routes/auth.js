const express = require("express");
const prisma = require("../prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();


// Helpers
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/;


//  Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    //  Required fields
    if (!name || !email || !password || !address) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // ✅ Name validation
    if (name.length < 20 || name.length > 60) {
      return res.status(400).json({
        error: "Name must be 20–60 characters",
      });
    }

    //  Email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Address validation
    if (address.length > 400) {
      return res.status(400).json({
        error: "Address must be under 400 characters",
      });
    }

    // Password validation
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be 8–16 chars, include uppercase & special char",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role: "USER",
      },
    });

    res.json({
      message: "User registered ✅",
      user,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Signup failed",
    });
  }
});

module.exports = router;
