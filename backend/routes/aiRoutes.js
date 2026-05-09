const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/summarize", async (req, res) => {

  try {
    const { note } = req.body;
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/auto",

        messages: [
          {
            role: "user",
            content: `
            You are a smart AI productivity assistant.

            Analyze the following note and provide:

            Summary:
            Focus Area:
            Next Step:

            Return the response in clean plain text only.
            Do not use markdown, stars, bullet points, or numbering.

            Note:
            ${note}
            `
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const summary =
      response.data.choices[0].message.content;

    res.json({
      success: true,
      summary,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "AI summary failed",
    });
  }
});

module.exports = router;