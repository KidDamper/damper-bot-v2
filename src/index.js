async function telegramSendMessage(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      const result = await env.DB
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all();

      return new Response(
        JSON.stringify({
          status: "online",
          database: "connected",
          telegram: "configured",
          tables: result.results
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    if (url.pathname === "/telegram/webhook") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      const update = await request.json();

      if (update.message?.chat?.id && update.message?.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text.trim();

        if (text === "/start") {
          await telegramSendMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            "Welcome to The Damper Bot V2! 🔥\n\nYour account system is coming online."
          );
        }
      }

      return new Response("OK");
    }

    return new Response("Not Found", { status: 404 });
  }
};
