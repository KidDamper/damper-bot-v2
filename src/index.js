const BANNER_FILE_ID =
  "AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA";

const MEME_CHANNEL = "@nah_idmeme";
const UPDATE_CHANNEL = "@Updamper_bot";

async function telegramApi(token, method, body) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function sendMessage(token, chatId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown"
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await telegramApi(token, "sendMessage", body);
}

async function sendPhoto(token, chatId, photo, caption, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "Markdown"
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await telegramApi(token, "sendPhoto", body);
}

async function answerCallback(token, callbackQueryId, text = "") {
  await telegramApi(token, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text
  });
}

async function checkMembership(token, channel, userId) {
  const response = await telegramApi(token, "getChatMember", {
    chat_id: channel,
    user_id: userId
  });

  const data = await response.json();

  if (!data.ok) {
    return false;
  }

  const status = data.result?.status;

  return ["creator", "administrator", "member"].includes(status);
}

function generateDamperId() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function joinKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🧠 JOIN MEME CHANNEL",
          url: "https://t.me/nah_idmeme"
        }
      ],
      [
        {
          text: "🔥 JOIN UPDATES CHANNEL",
          url: "https://t.me/Updamper_bot"
        }
      ],
      [
        {
          text: "✅ CHECK MEMBERSHIP",
          callback_data: "check_membership"
        }
      ]
    ]
  };
}

function menuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🎮 GAMES", callback_data: "menu_games" },
        { text: "💰 ECONOMY", callback_data: "menu_economy" }
      ],
      [
        { text: "⚔️ RPG", callback_data: "menu_rpg" },
        { text: "🛒 SHOP", callback_data: "menu_shop" }
      ],
      [
        { text: "🗃️ VAULT", callback_data: "menu_vault" },
        { text: "📊 LEADERBOARD", callback_data: "menu_leaderboard" }
      ],
      [
        { text: "👤 PROFILE", callback_data: "menu_profile" },
        { text: "❓ HELP", callback_data: "menu_help" }
      ]
    ]
  };
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

      /*
       * CALLBACK BUTTONS
       */
      if (update.callback_query) {
        const callback = update.callback_query;
        const chatId = callback.message?.chat?.id;
        const userId = callback.from?.id;

        if (callback.data === "check_membership") {
          const memeJoined = await checkMembership(
            env.TELEGRAM_BOT_TOKEN,
            MEME_CHANNEL,
            userId
          );

          const updatesJoined = await checkMembership(
            env.TELEGRAM_BOT_TOKEN,
            UPDATE_CHANNEL,
            userId
          );

          if (memeJoined && updatesJoined) {
            await answerCallback(
              env.TELEGRAM_BOT_TOKEN,
              callback.id,
              "Membership verified!"
            );

            let user = await env.DB
              .prepare("SELECT * FROM users WHERE telegram_id = ?")
              .bind(String(userId))
              .first();

            if (!user) {
              let damperId;

              while (true) {
                damperId = generateDamperId();

                const existing = await env.DB
                  .prepare("SELECT id FROM users WHERE damper_id = ?")
                  .bind(damperId)
                  .first();

                if (!existing) {
                  break;
                }
              }

              const createdAt = Math.floor(Date.now() / 1000);

              await env.DB
                .prepare(
                  `INSERT INTO users
                  (telegram_id, username, damper_id, role, created_at)
                  VALUES (?, ?, ?, 'PLAYER', ?)`
                )
                .bind(
                  String(userId),
                  callback.from?.username || null,
                  damperId,
                  createdAt
                )
                .run();

              user = await env.DB
                .prepare("SELECT * FROM users WHERE telegram_id = ?")
                .bind(String(userId))
                .first();

              await env.DB
                .prepare(
                  "INSERT INTO wallets (user_id, balance) VALUES (?, 500)"
                )
                .bind(user.id)
                .run();

              await env.DB
                .prepare(
                  `INSERT INTO xp
                  (user_id, damper_xp, level, rpg_xp, rpg_level)
                  VALUES (?, 0, 1, 0, 1)`
                )
                .bind(user.id)
                .run();
            }

            const wallet = await env.DB
              .prepare("SELECT balance FROM wallets WHERE user_id = ?")
              .bind(user.id)
              .first();

            const xp = await env.DB
              .prepare("SELECT level FROM xp WHERE user_id = ?")
              .bind(user.id)
              .first();

            const coins = wallet?.balance ?? 0;
            const level = xp?.level ?? 1;

            await sendPhoto(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              BANNER_FILE_ID,
              `🔥 *THE DAMPER_BOT V2*

\`SYSTEM ONLINE\`

*PLAYER*
🆔 \`${user.damper_id}\`

*WALLET*
💰 \`${coins}\` Damper Coins

*PROGRESS*
⭐ \`LEVEL ${level}\`

━━━━━━━━━━━━━━

*ACCOUNT READY*

Your journey starts here.

\`/menu\` → Enter the bot`,
              menuKeyboard()
            );
          } else {
            await answerCallback(
              env.TELEGRAM_BOT_TOKEN,
              callback.id,
              "You haven't joined both channels yet."
            );

            await sendMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `🔒 *ACCESS LOCKED*

You need to join both channels before entering THE DAMPER_BOT V2.

Join both, then press *CHECK MEMBERSHIP* again.`,
              joinKeyboard()
            );
          }
        }

        return new Response("OK");
      }

      /*
       * NORMAL MESSAGES
       */
      if (update.message?.chat?.id && update.message?.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text.trim();
        const username = update.message.from?.username || null;

        if (text === "/start") {
          const memeJoined = await checkMembership(
            env.TELEGRAM_BOT_TOKEN,
            MEME_CHANNEL,
            chatId
          );

          const updatesJoined = await checkMembership(
            env.TELEGRAM_BOT_TOKEN,
            UPDATE_CHANNEL,
            chatId
          );

          if (!memeJoined || !updatesJoined) {
            await sendMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `🔒 *WELCOME TO THE DAMPER_BOT V2*

Access to the bot is currently locked.

Join both official channels below to continue.

After joining, press *CHECK MEMBERSHIP*.`,
              joinKeyboard()
            );

            return new Response("OK");
          }

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

              if (!existing) {
                break;
              }
            }

            const createdAt = Math.floor(Date.now() / 1000);

            await env.DB
              .prepare(
                `INSERT INTO users
                (telegram_id, username, damper_id, role, created_at)
                VALUES (?, ?, ?, 'PLAYER', ?)`
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
                `INSERT INTO xp
                (user_id, damper_xp, level, rpg_xp, rpg_level)
                VALUES (?, 0, 1, 0, 1)`
              )
              .bind(user.id)
              .run();
          }

          const wallet = await env.DB
            .prepare("SELECT balance FROM wallets WHERE user_id = ?")
            .bind(user.id)
            .first();

          const xp = await env.DB
            .prepare("SELECT level FROM xp WHERE user_id = ?")
            .bind(user.id)
            .first();

          const coins = wallet?.balance ?? 0;
          const level = xp?.level ?? 1;

          await sendPhoto(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            BANNER_FILE_ID,
            `🔥 *THE DAMPER_BOT V2*

\`SYSTEM ONLINE\`

*PLAYER*
🆔 \`${user.damper_id}\`

*WALLET*
💰 \`${coins}\` Damper Coins

*PROGRESS*
⭐ \`LEVEL ${level}\`

━━━━━━━━━━━━━━

*ACCOUNT READY*

Your journey starts here.

\`/menu\` → Enter the bot`,
            menuKeyboard()
          );
        }
      }

      return new Response("OK");
    }

    return new Response("Not Found", { status: 404 });
  }
};
