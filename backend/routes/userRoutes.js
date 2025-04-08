const express = require("express");
const jwt = require('jsonwebtoken');
const bcryptjs = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

// User registration
router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;

   
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    
    const token = req.headers.authorization?.split(" ")[1];  
    if (!token) {
        return res.status(401).json({ message: "Token is required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  
        const loggedInUserRole = decoded.role; 

        
        if (role === "admin" || role === "manager") {
            if (loggedInUserRole !== "admin") {
                return res.status(403).json({ message: "Only admins can register managers or new admins" });
            }
        }

        
        console.log("Password to hash:", password);
        const hashedPassword = await bcryptjs.hash(password, 10);

        
        db.query(
            "INSERT INTO user (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role],
            (err, result) => {
                if (err) {
                    console.error("Error inserting user:", err);
                    return res.status(500).send(err);
                }
                res.status(201).json({ message: "User registered successfully" });
            }
        );
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
});

// User login
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    
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

      
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

       
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

// Get all users
router.get("/all", (req, res) => {
    console.log("Fetching all users");
    db.query("SELECT id, name, email, role, created_at FROM user", (err, results) => {
        if (err) {
            console.error("Error fetching users:", err);
            return res.status(500).send(err);
        }
        res.json({ users: results });
    });
});

module.exports = router;
