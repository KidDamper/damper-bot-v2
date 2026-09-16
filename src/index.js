export default {
  async fetch(request, env) {
    const result = await env.DB
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all();

    return new Response(
      JSON.stringify({
        status: "online",
        database: "connected",
        tables: result.results
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
