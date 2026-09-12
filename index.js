export default {
  async fetch(request) {
    return new Response(
      JSON.stringify({
        success: true,
        app: "KAICODE",
        message: "KAICODE backend is online!"
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
