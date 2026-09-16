const BANNER_FILE_ID =
  "AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA";

async function telegramApi(token, method, body) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function sendPhoto(token, chatId, photo, caption) {
  await telegramApi(token, "sendPhoto", {
    chat_id: chatId,
    photo,
    caption
  });
}

function generateDamperId() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      const result = await env.DB
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
        )
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
        const username = update.message.from?.username || null;

        if (text === "/start") {
          let user = await env.DB
            .prepare("SELECT * FROM users WHERE telegram_id = ?")
            .bind(String(chatId))
            .first();

          if (!user) {
            let damperId;

            while (true) {
              damperId = generateDamperId();

              const existing = await env.DB
                .prepare("SELECT id FROM users WHERE damper_id = ?")
                .bind(damperId)
                .first();

              if (!existing) break;
            }

            const createdAt = Math.floor(Date.now() / 1000);

            await env.DB
              .prepare(
                "INSERT INTO users (telegram_id, username, damper_id, role, created_at) VALUES (?, ?, ?, 'PLAYER', ?)"
              )
              .bind(
                String(chatId),
                username,
                damperId,
                createdAt
              )
              .run();

            user = await env.DB
              .prepare("SELECT * FROM users WHERE telegram_id = ?")
              .bind(String(chatId))
              .first();

            await env.DB
              .prepare(
                "INSERT INTO wallets (user_id, balance) VALUES (?, 500)"
              )
              .bind(user.id)
              .run();

            await env.DB
              .prepare(
                "INSERT INTO xp (user_id, damper_xp, level, rpg_xp, rpg_level) VALUES (?, 0, 1, 0, 1)"
              )
              .bind(user.id)
              .run();
          }

          await sendPhoto(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            BANNER_FILE_ID,
            `🔥 THE DAMPER_BOT V2\n\nDamper ID: ${user.damper_id}\n💰 Coins: 500\n⭐ Level: 1\n\nYour account is ready.`
          );
        }
      }

      return new Response("OK");
    }

    return new Response("Not Found", { status: 404 });
  }
};
