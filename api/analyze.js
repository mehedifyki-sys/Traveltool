export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { image } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is missing in Vercel Environment Variables" });
    }

    if (!image) {
      return res.status(400).json({ error: "No image received from frontend" });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this flight screenshot. Return clear travel-agent itinerary details, airline, outbound/inbound times, layovers, price, baggage notes if visible, and a client-ready script.`
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ]
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(500).json({
        error: "OpenAI API error",
        details: data
      });
    }

    const text = data.choices?.[0]?.message?.content || "No result returned.";

    return res.status(200).json({
      best_option_summary: "AI analysis completed. Please verify fare and baggage before ticketing.",
      flight_options: [
        {
          option_number: 1,
          is_best: true,
          airline: "Detected from screenshot",
          price_per_person: "",
          total_price: "",
          cabin_or_fare: "",
          itinerary: text,
          script: text,
          verification_notes: "Verify baggage allowance, fare rules, cancellation policy, and seat selection before ticketing."
        }
      ]
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crashed",
      details: err.message
    });
  }
}
