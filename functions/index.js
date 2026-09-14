export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        success: true,
        app: "KAICODE",
        status: "online",
        message: "KAICODE AI backend is online!"
      }),
      { status: 200, headers }
    );
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed."
      }),
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json();

    const prompt = String(body.prompt || "").trim();
    const language = String(body.language || "English");
    const technology = String(body.technology || "Automatic");
    const instructions = String(body.instructions || "");

    if (!prompt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No project idea was provided."
        }),
        { status: 400, headers }
      );
    }

    const systemPrompt = `
You are KAI, the AI coding assistant inside KAICODE.

The user wants to build:
${prompt}

Language:
${language}

Technology:
${technology}

Extra instructions:
${instructions}

Understand the user's idea and generate useful programming code or a clear project implementation plan.

If the user asks for an app, explain/generate the main project structure and code needed to build it.
Be practical and beginner-friendly.
Do not claim that an APK has been built unless it actually has.
`;

    const result = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500
      }
    );

    const aiMessage =
      result?.response ||
      "KAI could not generate a response.";

    return new Response(
      JSON.stringify({
        success: true,
        app: "KAICODE",
        status: "generated",
        message: aiMessage,
        project: {
          idea: prompt,
          language: language,
          technology: technology,
          instructions: instructions
        }
      }),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "AI generation failed.",
        details: String(error?.message || error)
      }),
      { status: 500, headers }
    );
  }
}
