const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "../data/db.json");
const JWT_SECRET = process.env.JWT_SECRET || "inventory_management_secret_2026_default";

const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!fs.existsSync(dbPath)) {
      return res.status(500).json({
        message: "Database file not found",
      });
    }

    const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const user = data.users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: error.message || "Internal server error during login",
    });
  }
};

module.exports = {
  login,
};
