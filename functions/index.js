export async function onRequest(context) {
  const request = context.request;

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
        message: "KAICODE backend is online!"
      }),
      {
        status: 200,
        headers
      }
    );
  }

  if (request.method === "POST") {
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
          {
            status: 400,
            headers
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          app: "KAICODE",
          status: "received",
          message: "KAI received your project idea.",
          project: {
            idea: prompt,
            language: language,
            technology: technology,
            instructions: instructions
          }
        }),
        {
          status: 200,
          headers
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON request."
        }),
        {
          status: 400,
          headers
        }
      );
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: "Method not allowed."
    }),
    {
      status: 405,
      headers
    }
  );
}
