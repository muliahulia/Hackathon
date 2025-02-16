// import express from "express";
// import axios from "axios";
// import dotenv from "dotenv";
// import cors from "cors";

// dotenv.config();
// const app = express();
// app.use(express.json());
// app.use(cors());

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// app.post("/chat", async (req, res) => {
//     try {
//         const response = await axios.post(
//             "https://api.openai.com/v1/chat/completions",
//             {
//                 model: "gpt-4",
//                 messages: [{ role: "user", content: req.body.prompt }],
//             },
//             {
//                 headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//             }
//         );
//         res.json({ reply: response.data.choices[0].message.content });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// app.post("/generate-image", async (req, res) => {
//     try {
//         const response = await axios.post(
//             "https://api.openai.com/v1/images/generations",
//             {
//                 model: "dall-e-3",
//                 prompt: req.body.prompt,
//                 n: 1,
//                 size: "1024x1024",
//             },
//             {
//                 headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//             }
//         );
//         res.json({ imageUrl: response.data.data[0].url });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// app.listen(3000, () => console.log("Server running on port 3000"));
