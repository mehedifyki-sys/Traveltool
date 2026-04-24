export default async function handler(req, res) {
  try {
    const { image, context } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract flight details and return JSON." },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json(data);
    }

    const text = data.choices?.[0]?.message?.content || "{}";

    return res.status(200).json({
      flight_options: [
        {
          option_number: 1,
          is_best: true,
          airline: "Detected from AI",
          itinerary: text,
          script: text,
          verification_notes: "Verify details before booking."
        }
      ]
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
