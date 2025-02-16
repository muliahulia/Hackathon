import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

// Enable CORS with specific origin (adjust as necessary)
app.use(cors({ origin: 'http://yourfrontenddomain.com' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Endpoint for Chat Completion using GPT-4
app.post("/chat", async (req, res) => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",  // You can change the model if you prefer a different one
                messages: [{ role: "user", content: req.body.prompt }],
            },
            {
                headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            }
        );
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Error during chat completion:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint for generating image using DALL-E
app.post("/generate-image", async (req, res) => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
                model: "dall-e-3",  // Ensure this matches with the correct model
                prompt: req.body.prompt,
                n: 1,
                size: "1024x1024",  // Can adjust size if needed
            },
            {
                headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            }
        );
        // If the API call is successful, send the image URL
        res.json({ imageUrl: response.data.data[0].url });
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: error.message });
    }
});

// Start the Express server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
