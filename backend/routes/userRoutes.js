const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

// User registration
router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO user (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.status(201).json({ message: "User registered successfully" });
        }
    );
});

// User login
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    db.query("SELECT * FROM user WHERE email = ?", [email], async (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        const user = results[0];

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create a JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        // Send the response with the token and user data
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    });
});



//get all users
router.get("/all", (req, res) => {
    console.log("Fetching all users"); 
    db.query("SELECT id, name, email, role, created_at FROM user", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json({ users: results });
    });
});


module.exports = router;
