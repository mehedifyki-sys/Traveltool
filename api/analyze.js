export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, context } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const prompt = `
You are an expert travel agent assistant.

Analyze the flight screenshot carefully and extract every visible flight option separately.

Return ONLY valid JSON with this exact structure:

{
  "best_option_summary": "",
  "flight_options": [
    {
      "option_number": 1,
      "is_best": true,
      "airline": "",
      "price_per_person": "",
      "total_price": "",
      "cabin_or_fare": "",
      "outbound": {
        "departure_airport": "",
        "arrival_airport": "",
        "departure_city": "",
        "arrival_city": "",
        "departure_date": "",
        "departure_time": "",
        "arrival_date": "",
        "arrival_time": "",
        "duration": "",
        "stops": "",
        "layover_details": ""
      },
      "inbound": {
        "departure_airport": "",
        "arrival_airport": "",
        "departure_city": "",
        "arrival_city": "",
        "departure_date": "",
        "departure_time": "",
        "arrival_date": "",
        "arrival_time": "",
        "duration": "",
        "stops": "",
        "layover_details": ""
      },
      "total_travel_time": "",
      "baggage_allowance": "",
      "itinerary": "",
      "script": "",
      "verification_notes": ""
    }
  ]
}

Rules:
- If the screenshot shows direct/nonstop flight, say no layover.
- If a layover is visible, mention city/airport and layover time.
- If baggage is not visible, say: "Baggage allowance is not visible in the screenshot and must be verified before ticketing."
- If fare is Basic Economy/Main Basic, mention baggage and change restrictions may apply.
- Generate a natural travel-agent script.
- Compare multiple options and mark best option based on price, duration, stops, arrival time, and convenience.
- Do not invent details that are not visible.
- Use user context only to fill missing city/date labels if screenshot supports it.

User context:
Origin: ${context?.origin || ""}
Destination: ${context?.destination || ""}
Departure date: ${context?.departureDate || ""}
Return date: ${context?.returnDate || ""}
Travellers: ${context?.travellers || ""}
Cabin: ${context?.cabin || ""}
`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: image }
            ]
          }
        ],
        temperature: 0
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(500).json({ error: data });
    }

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "";

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({
      error: "Failed to analyze image",
      details: err.message
    });
  }
}
