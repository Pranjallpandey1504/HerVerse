const express = require("express");
const path = require("path");
require("dotenv").config();
const mongoose = require("mongoose");
const twilio = require("twilio");
const multer = require("multer");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, "../public")));  // Serve static files

// MongoDB Connection (Use remote DB instead of localhost)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.error("MongoDB Connection Error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    location: Object,
    bio: String,
    profilePic: String,
});
const User = mongoose.model("users", UserSchema);

// Serve HTML pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));
app.get("/:page", (req, res) => {
    res.sendFile(path.join(__dirname, "../views", `${req.params.page}.html`), (err) => {
        if (err) res.status(404).send("Page Not Found");
    });
});

// Profile API Routes
app.get("/api/profile/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/profile/:id", async (req, res) => {
    try {
        const { name, email, phone, location, bio, profilePic } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.params.id, 
            { name, email, phone, location, bio, profilePic },
            { new: true, upsert: true }
        );
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Export for Vercel
module.exports = app;
