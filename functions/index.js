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
        message: "KAICODE AI backend is online!",
        features: {
          aiGeneration: true,
          codeGeneration: true,
          apkBuildRequest: true
        }
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

    const action = String(body.action || "generate").trim();
    const prompt = String(body.prompt || "").trim();
    const language = String(body.language || "English");
    const technology = String(body.technology || "Automatic");
    const instructions = String(body.instructions || "");

    if (action === "build_apk") {
      const projectCode = String(body.code || "").trim();

      if (!projectCode) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "No project code was provided."
          }),
          { status: 400, headers }
        );
      }

      if (
        !env.KAICODE_TOKEN ||
        !env.GITHUB_OWNER ||
        !env.GITHUB_REPO ||
        !env.GITHUB_WORKFLOW
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            status: "build_engine_required",
            error: "APK build engine is not connected yet."
          }),
          { status: 503, headers }
        );
      }

      const projectCodeBase64 = btoa(
        unescape(encodeURIComponent(projectCode))
      );

      const buildId = `KAI-${Date.now()}`;

      const githubUrl =
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW}/dispatches`;

      const buildResponse = await fetch(githubUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.KAICODE_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            build_id: buildId,
            project_code: projectCodeBase64,
            language: language,
            technology: technology
          }
        })
      });

      if (!buildResponse.ok) {
        const errorText = await buildResponse.text();

        return new Response(
          JSON.stringify({
            success: false,
            status: "build_failed",
            error: "Could not start APK build.",
            details: errorText
          }),
          { status: 500, headers }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          app: "KAICODE",
          status: "build_started",
          message: "APK build started successfully.",
          build_id: buildId,
          project: {
            language: language,
            technology: technology
          }
        }),
        { status: 200, headers }
      );
    }

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

Turn the user's idea into a practical software project.

User idea:
${prompt}

Language:
${language}

Technology:
${technology}

Extra instructions:
${instructions}

IMPORTANT OUTPUT RULES:

1. Give a useful explanation of what you created.
2. When coding is requested, provide COMPLETE usable code.
3. Put code inside markdown code fences.
4. Clearly identify the programming language.
5. Do not claim that an APK has been built.
6. If the user requests an Android app, generate code suitable for the selected Android technology.
7. Keep the answer practical and implementation-focused.
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
        max_tokens: 4000
      }
    );

    const aiMessage =
      result?.response ||
      "KAI could not generate a response.";

    let generatedCode = "";

    const codeMatch = aiMessage.match(
      /```(?:[a-zA-Z0-9_+#.-]+)?\s*([\s\S]*?)```/
    );

    if (codeMatch && codeMatch[1]) {
      generatedCode = codeMatch[1].trim();
    }

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
          instructions: instructions,
          code: generatedCode,
          buildable:
            technology.toLowerCase().includes("android") ||
            technology.toLowerCase().includes("kotlin")
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
