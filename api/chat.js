const OPENAI_API_URL = "https://api.openai.com/v1/responses";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const { systemPrompt, messages = [] } = request.body || {};

    if (!systemPrompt || !Array.isArray(messages)) {
      return response.status(400).json({ error: "Invalid chat payload" });
    }

    const openAiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions: systemPrompt,
        input: messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: String(message.content || "").slice(0, 1200)
        })),
        max_output_tokens: 350
      })
    });

    const data = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return response.status(openAiResponse.status).json({
        error: data.error?.message || "OpenAI request failed"
      });
    }

    const answer =
      data.output_text ||
      data.output?.flatMap((item) => item.content || [])
        .find((content) => content.type === "output_text")?.text ||
      "";

    return response.status(200).json({ answer });
  } catch (error) {
    return response.status(500).json({ error: "Unable to generate chat response" });
  }
}
