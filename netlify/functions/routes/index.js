const express = require('express');
const router = express.Router();


router.get("/proxy", async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    const headers = { ...req.headers };
    delete headers.host; // Remove 'host' header to avoid conflicts

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
