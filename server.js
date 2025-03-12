const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config();
const mongoose = require("mongoose");
const twilio = require("twilio");
const multer = require("multer");

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static("public")); 

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/herverse", {
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

// Routes for Pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/about", (req, res) => res.sendFile(path.join(__dirname, "views", "about.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "views", "contact.html")));
app.get("/profile", (req, res) => res.sendFile(path.join(__dirname, "views", "profile.html")));
app.get("/fitness", (req, res) => res.sendFile(path.join(__dirname, "views", "fitness.html")));
app.get("/watch-videos", (req, res) => res.sendFile(path.join(__dirname, "views", "watch-videos.html")));
app.get("/safety", (req, res) => res.sendFile(path.join(__dirname, "views", "safety.html")));
app.get("/sisterhood", (req, res) => res.sendFile(path.join(__dirname, "views", "sisterhood.html")));
app.get("/finance", (req, res) => res.sendFile(path.join(__dirname, "views", "finance.html")));
app.get("/edit", (req, res) => res.sendFile(path.join(__dirname, "views", "edit.html")));

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

// Twilio setup
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_NUMBER;

// Send SOS alert
app.post('/send-sos', async (req, res) => {
    const user = await User.findOne(); // Fetch user (Modify for authentication)
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.phone === TWILIO_NUMBER) {
        return res.status(400).json({ message: "Invalid recipient: Cannot send SMS to the Twilio sender number." });
    }

    try {
        const message = await client.messages.create({
            body: 'SOS Alert! Your loved one is in danger. Please check immediately!',
            from: TWILIO_NUMBER,
            to: user.phone
        });

        res.json({ message: 'SOS Alert Sent!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send SOS alert.' });
    }
});

// Update Live Location
app.post("/update-location", async (req, res) => {
    const { lat, lng } = req.body;
    await User.updateOne({}, { location: { lat, lng } });
    res.json({ message: "Location Updated" });
});

// Route to handle form submission from edit.html
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post("/edit", upload.single("profilePic"), async (req, res) => {
    try {
        const { name, email, phone, bio } = req.body;
        const profilePic = req.file ? req.file.filename : null;
       
        const updatedUser = await User.updateOne({}, 
            { name, email, phone, bio, profilePic },
            { upsert: true }
        );
        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
