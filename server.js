const express = require("express");
const cors = require("cors"); // Import the CORS middleware
const fetch = require("node-fetch");

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // Middleware to parse JSON requests

// Your UPS API credentials
const CLIENT_ID = "gIwq9XE7Xvl2AGkW20F61eMuo9OO40rAGWwUIkthEbiEDyUI"; // Replace with your actual Client ID
const CLIENT_SECRET = "3TLuzNtYr46DEqSMCzVNcxPAGtlXq8oGaVhnFxQd5F6ANZbkEM080hoQbDYE3d0B"; // Replace with your actual Client Secret

const UPS_TOKEN_URL = "https://onlinetools.ups.com/security/v1/oauth/token";
const UPS_TRANSIT_URL = "https://onlinetools.ups.com/api/shipments/v1/transittimes";

// Endpoint to fetch UPS OAuth Token
app.post("/api/ups/token", async (req, res) => {
  try {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const response = await fetch(UPS_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data); // Send token to frontend
    } else {
      console.error("Token Fetch Error:", data);
      res.status(500).json({ error: "Failed to fetch UPS token" });
    }
  } catch (error) {
    console.error("Error fetching UPS token:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to fetch UPS Transit Times
app.post("/api/ups/transit", async (req, res) => {
  try {
    const { upsToken, payload } = req.body; // Frontend sends token and payload
    const response = await fetch(UPS_TRANSIT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${upsToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data); // Send transit times to frontend
    } else {
      console.error("Transit Time Fetch Error:", data);
      res.status(500).json({ error: "Failed to fetch UPS transit times" });
    }
  } catch (error) {
    console.error("Error fetching transit times:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = 3000; // You can change this port if needed
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});