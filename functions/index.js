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
    return new Response(null, { status: 204, headers });
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
You are KAI, the coding AI inside KAICODE by KairoBuilds.

Help the user turn their idea into a real software project.

User idea:
${prompt}

Language:
${language}

Technology:
${technology}

Extra instructions:
${instructions}

Give practical, useful coding guidance and code when appropriate.
If the user asks for an app, explain the project structure and provide the code needed for the requested part.
Do not claim an APK was built unless an actual build system has built it.
`;

    const result = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
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
      result?.response || "KAI could not generate a response.";

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
